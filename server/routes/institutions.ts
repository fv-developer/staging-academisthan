import express, { Response } from 'express';
import pool from '../config/database';
import { authenticate, AuthRequest } from '../utils/auth';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { sendAdminNewInstitutionEmail, sendAdminInstitutionResubmittedEmail, sendInstitutionRegistrationConfirmationEmail, sendInstitutionResubmittedConfirmationEmail, sendInstitutionDeletedEmail } from '../services/email';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper to check for non-official public email domains
const isPublicEmailDomain = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  const publicDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'aol.com', 'zoho.com', 'yandex.com', 'mail.com', 
    'protonmail.com', 'icloud.com', 'live.com', 'gmx.com'
  ];
  return publicDomains.includes(domain);
};

// Autocomplete institutions search
router.get('/autocomplete', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }
    const [rows]: any = await pool.execute(
      'SELECT DISTINCT name FROM institutions WHERE name LIKE ? AND status = "approved" LIMIT 10',
      [`%${query}%`]
    );
    res.json(rows.map((r: any) => r.name));
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Failed to autocomplete institutions' });
  }
});

// Get user's registered institutions (authenticated)
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [rows] = await pool.execute(
      'SELECT * FROM institutions WHERE registered_by = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ institutions: rows });
  } catch (error) {
    console.error('Get my institutions error:', error);
    res.status(500).json({ error: 'Failed to get registered institutions' });
  }
});

// Create institution registration
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      name,
      institute_code,
      type,
      address,
      city,
      state,
      country,
      pincode,
      contact_person,
      contact_email,
      contact_phone,
      website,
      established_year,
      accreditation,
      document_url,
      description,
      student_count,
      faculty_count,
      logo_url,
      leadership
    } = req.body;

    // Validation
    if (!name || !contact_email) {
      return res.status(400).json({ error: 'Institution name and contact email are required' });
    }

    if (!document_url) {
      return res.status(400).json({ error: 'Supporting verification document is required' });
    }

    // Official email check
    if (isPublicEmailDomain(contact_email)) {
      return res.status(400).json({ 
        error: 'Please use your official institutional email address (e.g. your-name@institutename.com) for verification.' 
      });
    }

    // Established year check
    const currentYear = new Date().getFullYear();
    if (established_year && parseInt(established_year) > currentYear) {
      return res.status(400).json({ error: 'Established year cannot be in the future.' });
    }

    const institutionId = uuidv4();

// Auto-migrate campus media columns in institutions table if missing
(async () => {
  try {
    await pool.execute('ALTER TABLE institutions ADD COLUMN IF NOT EXISTS campus_gallery LONGTEXT').catch(() => {});
    await pool.execute('ALTER TABLE institutions ADD COLUMN IF NOT EXISTS campus_video_url TEXT').catch(() => {});
    await pool.execute('ALTER TABLE institutions ADD COLUMN IF NOT EXISTS youtube_url TEXT').catch(() => {});
  } catch (err) {
    console.error('Institutions schema migration error:', err);
  }
})();

    // Extract campus media attributes
    const { campus_gallery, campus_video_url, youtube_url } = req.body;
    const campusGalleryJson = campus_gallery ? (typeof campus_gallery === 'string' ? campus_gallery : JSON.stringify(campus_gallery)) : null;

    // Insert institution
    await pool.execute(
      `INSERT INTO institutions (
        id, name, institute_code, type, address, city, state, country, pincode,
        contact_person, contact_email, contact_phone,
        website, established_year, student_count, faculty_count, accreditation, document_url, logo_url, description,
        campus_gallery, campus_video_url, youtube_url,
        status, membership_status, email_verified, registered_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'inactive', FALSE, ?)`,
      [
        institutionId,
        name,
        institute_code || null,
        type || null,
        address || null,
        city || null,
        state || null,
        country || 'India',
        pincode || null,
        contact_person || null,
        contact_email,
        contact_phone || null,
        website || null,
        established_year || null,
        student_count || null,
        faculty_count || null,
        accreditation || null,
        document_url,
        logo_url || null,
        description || null,
        campusGalleryJson,
        campus_video_url || null,
        youtube_url || null,
        userId
      ]
    );

    // Insert leadership profiles if provided
    if (leadership && Array.isArray(leadership)) {
      for (const lead of leadership) {
        const leadId = uuidv4();
        await pool.execute(
          `INSERT INTO institution_leadership (
            id, institution_id, role, full_name, designation, email, phone, photo_url, linkedin_url, google_scholar_url, admin_verified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            leadId,
            institutionId,
            lead.role,
            lead.fullName,
            lead.designation,
            lead.email,
            lead.phone,
            lead.photoUrl || null,
            lead.linkedinUrl || null,
            lead.googleScholarUrl || null
          ]
        );
      }
    }

    // Update user profile with institution_id and designation (if provided)
    if (req.body.representative_designation) {
      await pool.execute(
        'UPDATE profiles SET institution_id = ?, designation = ? WHERE id = ?',
        [institutionId, req.body.representative_designation, userId]
      );
    } else {
      await pool.execute(
        'UPDATE profiles SET institution_id = ? WHERE id = ?',
        [institutionId, userId]
      );
    }

    // Send confirmation email to the user
    try {
      await sendInstitutionRegistrationConfirmationEmail(contact_email, contact_person || 'Representative', name);
    } catch (err) {
      console.error('Failed to send user institution registration confirmation email:', err);
    }

    // Notify admins about new registration
    const [admins]: any = await pool.execute(
      `SELECT ar.user_id, p.email, p.full_name FROM admin_roles ar
       JOIN profiles p ON ar.user_id = p.id`
    );
    for (const adminRow of admins) {
      await pool.execute(
        `INSERT INTO notifications (id, user_id, trigger_user_id, type, title, message, link)
         VALUES (?, ?, ?, 'institution_status', 'New Institution Submission 🏛️', ?, '/admin/institutions')`,
        [uuidv4(), adminRow.user_id, userId, `A new institution registration for "${name}" has been submitted.`]
      );
      if (adminRow.email) {
        sendAdminNewInstitutionEmail(adminRow.email, adminRow.full_name || 'Admin', name).catch(err => {
          console.error('Failed to send admin institution signup email:', err);
        });
      }
    }

    // Get the created institution
    const [institutions]: any = await pool.execute(
      'SELECT * FROM institutions WHERE id = ?',
      [institutionId]
    );

    res.status(201).json({
      message: 'Institution registered successfully and is awaiting admin approval.',
      institution: institutions[0],
    });
  } catch (error) {
    console.error('Institution registration error:', error);
    res.status(500).json({ error: 'Failed to register institution' });
  }
});

// Update institution (Fellow/Owner edit)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      name,
      institute_code,
      type,
      address,
      city,
      state,
      country,
      pincode,
      contact_phone,
      website,
      established_year,
      accreditation,
      document_url,
      description,
      logo_url,
      student_count,
      faculty_count,
      representative_designation,
      campus_gallery,
      campus_video_url,
      youtube_url,
      leadership
    } = req.body;

    const campusGalleryJson = campus_gallery !== undefined ? (typeof campus_gallery === 'string' ? campus_gallery : JSON.stringify(campus_gallery)) : undefined;

    // Retrieve active details
    const [current]: any = await pool.execute(
      'SELECT * FROM institutions WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Sync designation to profile if provided
    if (representative_designation) {
      await pool.execute(
        'UPDATE profiles SET designation = ? WHERE id = ?',
        [representative_designation, userId]
      );
    }

    // Auth check: Must be owner/registrant or admin
    if (current[0].registered_by !== userId) {
      // Check if user is admin
      const [isAdmin]: any = await pool.execute(
        'SELECT id FROM admin_roles WHERE user_id = ?',
        [userId]
      );
      if (isAdmin.length === 0) {
        return res.status(403).json({ error: 'Unauthorized to edit this institution' });
      }
    }

    // Sync leadership profiles if provided
    if (leadership && Array.isArray(leadership)) {
      // Check if current editor is admin
      let isAdminEditor = false;
      const [adminCheck]: any = await pool.execute(
        'SELECT id FROM admin_roles WHERE user_id = ?',
        [userId]
      );
      if (adminCheck.length > 0) {
        isAdminEditor = true;
      }

      // Delete old ones first
      await pool.execute('DELETE FROM institution_leadership WHERE institution_id = ?', [id]);
      
      // Insert new ones
      for (const lead of leadership) {
        const leadId = uuidv4();
        const adminVerifiedVal = isAdminEditor ? (lead.admin_verified || 0) : 0;
        await pool.execute(
          `INSERT INTO institution_leadership (
            id, institution_id, role, full_name, designation, email, phone, photo_url, linkedin_url, google_scholar_url, admin_verified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            leadId,
            id,
            lead.role,
            lead.fullName || lead.full_name,
            lead.designation,
            lead.email,
            lead.phone,
            lead.photoUrl || lead.photo_url || null,
            lead.linkedinUrl || lead.linkedin_url || null,
            lead.googleScholarUrl || lead.google_scholar_url || null,
            adminVerifiedVal
          ]
        );
      }
    }

    // Detect changes in protected fields: name, country, state, city, established_year
    const protectedFieldsChanged = 
      (name && name !== current[0].name) ||
      (country && country !== current[0].country) ||
      (state && state !== current[0].state) ||
      (city && city !== current[0].city) ||
      (established_year && parseInt(established_year) !== current[0].established_year);

    // Only create change requests for already approved institutions
    if (protectedFieldsChanged && current[0].status === 'approved') {
      // Create a change request entry
      const requestId = uuidv4();
      await pool.execute(
        `INSERT INTO institution_change_requests (
          id, institution_id, fellow_id, name, country, state, city, established_year, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          requestId,
          id,
          userId,
          name || current[0].name,
          country || current[0].country,
          state || current[0].state,
          city || current[0].city,
          established_year ? parseInt(established_year) : current[0].established_year
        ]
      );

      // Update non-protected fields in institutions table directly, and set status to pending_change_approval
      await pool.execute(
        `UPDATE institutions SET
          address = ?, pincode = ?, contact_phone = ?, website = ?, 
          accreditation = ?, document_url = ?, logo_url = ?, description = ?, 
          student_count = ?, faculty_count = ?, campus_gallery = ?, campus_video_url = ?, youtube_url = ?, status = 'pending_change_approval'
         WHERE id = ?`,
        [
          address !== undefined ? address : current[0].address,
          pincode !== undefined ? pincode : current[0].pincode,
          contact_phone !== undefined ? contact_phone : current[0].contact_phone,
          website !== undefined ? website : current[0].website,
          accreditation !== undefined ? accreditation : current[0].accreditation,
          document_url !== undefined ? document_url : current[0].document_url,
          logo_url !== undefined ? logo_url : current[0].logo_url,
          description !== undefined ? description : current[0].description,
          student_count !== undefined ? student_count : current[0].student_count,
          faculty_count !== undefined ? faculty_count : current[0].faculty_count,
          campusGalleryJson !== undefined ? campusGalleryJson : current[0].campus_gallery,
          campus_video_url !== undefined ? campus_video_url : current[0].campus_video_url,
          youtube_url !== undefined ? youtube_url : current[0].youtube_url,
          id
        ]
      );

      // Notify admins
      const [admins]: any = await pool.execute(
        'SELECT user_id FROM admin_roles'
      );
      for (const adminRow of admins) {
        await pool.execute(
          `INSERT INTO notifications (id, user_id, trigger_user_id, type, title, message, link)
           VALUES (?, ?, ?, 'institution_status', 'Pending Change Request 📝', ?, '/admin/institutions')`,
          [uuidv4(), adminRow.user_id, userId, `A change request for "${current[0].name}" is awaiting admin review.`]
        );
      }

      return res.json({
        message: 'Your update request has been submitted and is awaiting admin approval.',
        status: 'pending_change_approval'
      });
    } else {
      // If the institution is currently rejected or suspended, editing resets it to pending review
      const newStatus = (current[0].status === 'rejected' || current[0].status === 'suspended') ? 'pending' : current[0].status;

      await pool.execute(
        `UPDATE institutions SET
          name = ?, institute_code = ?, type = ?, address = ?, city = ?, state = ?, country = ?, pincode = ?, contact_phone = ?, 
          website = ?, established_year = ?, accreditation = ?, document_url = ?, logo_url = ?, description = ?,
          student_count = ?, faculty_count = ?, campus_gallery = ?, campus_video_url = ?, youtube_url = ?, status = ?, rejection_reason = NULL, suspension_reason = NULL
         WHERE id = ?`,
        [
          name !== undefined ? name.trim() : current[0].name,
          institute_code !== undefined ? (institute_code.trim() || null) : current[0].institute_code,
          type !== undefined ? type : current[0].type,
          address !== undefined ? address.trim() : current[0].address,
          city !== undefined ? city : current[0].city,
          state !== undefined ? state : current[0].state,
          country !== undefined ? country : current[0].country,
          pincode !== undefined ? pincode.trim() : current[0].pincode,
          contact_phone !== undefined ? contact_phone : current[0].contact_phone,
          website !== undefined ? website.trim() : current[0].website,
          established_year !== undefined ? parseInt(established_year) : current[0].established_year,
          accreditation !== undefined ? accreditation : current[0].accreditation,
          document_url !== undefined ? document_url : current[0].document_url,
          logo_url !== undefined ? logo_url : current[0].logo_url,
          description !== undefined ? description.trim() : current[0].description,
          student_count !== undefined ? student_count : current[0].student_count,
          faculty_count !== undefined ? faculty_count : current[0].faculty_count,
          campusGalleryJson !== undefined ? campusGalleryJson : current[0].campus_gallery,
          campus_video_url !== undefined ? campus_video_url : current[0].campus_video_url,
          youtube_url !== undefined ? youtube_url : current[0].youtube_url,
          newStatus,
          id
        ]
      );

      const wasResubmitted = (current[0].status === 'rejected' || current[0].status === 'suspended');
      const message = wasResubmitted
        ? 'Institution details resubmitted for admin review successfully.'
        : 'Institution profile updated successfully.';

      if (wasResubmitted) {
        const instName = name !== undefined ? name.trim() : current[0].name;
        // Send confirmation email to the user
        try {
          await sendInstitutionResubmittedConfirmationEmail(current[0].contact_email, current[0].contact_person || 'Representative', instName);
        } catch (err) {
          console.error('Failed to send user institution resubmission confirmation email:', err);
        }

        try {
          const [admins]: any = await pool.execute(
            `SELECT ar.user_id, p.email, p.full_name FROM admin_roles ar
             JOIN profiles p ON ar.user_id = p.id`
          );
          for (const adminRow of admins) {
            await pool.execute(
              `INSERT INTO notifications (id, user_id, type, title, message, link)
               VALUES (?, ?, 'institution_status', 'Institution Resubmitted 🏢', ?, '/admin/institutions')`,
              [uuidv4(), adminRow.user_id, `The institution "${instName}" has resubmitted details for review.`]
            );
            if (adminRow.email) {
              sendAdminInstitutionResubmittedEmail(adminRow.email, adminRow.full_name || 'Admin', instName).catch(err => {
                console.error('Failed to send admin institution resubmission email:', err);
              });
            }
          }
        } catch (err) {
          console.error('Failed to notify admins on institution resubmission:', err);
        }
      }

      return res.json({
        message,
        status: newStatus
      });
    }
  } catch (error) {
    console.error('Update institution error:', error);
    res.status(500).json({ error: 'Failed to update institution' });
  }
});

// Delete institution (Fellow owner)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Retrieve active details to check ownership
    const [rows]: any = await pool.execute(
      'SELECT * FROM institutions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institution = rows[0];

    // Auth check: Must be owner/registrant
    if (institution.registered_by !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this institution' });
    }

    // Delete associated records first (cascade keys/logs/change requests)
    await pool.execute(
      'DELETE FROM institution_change_requests WHERE institution_id = ?',
      [id]
    );

    await pool.execute(
      'DELETE FROM approval_logs WHERE institution_id = ?',
      [id]
    );

    // Update profiles referencing this institution
    await pool.execute(
      'UPDATE profiles SET institution_id = NULL WHERE institution_id = ?',
      [id]
    );

    // Delete the institution itself
    await pool.execute(
      'DELETE FROM institutions WHERE id = ?',
      [id]
    );

    // Send deletion confirmation email to the user
    if (institution.contact_email) {
      try {
        await sendInstitutionDeletedEmail(
          institution.contact_email,
          institution.contact_person || 'Representative',
          institution.name
        );
      } catch (err) {
        console.error('Failed to send deletion email:', err);
      }
    }

    res.json({ message: 'Institution deleted successfully' });
  } catch (error) {
    console.error('Delete institution error:', error);
    res.status(500).json({ error: 'Failed to delete institution' });
  }
});

// Get institution by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const [institutions]: any = await pool.execute(
      'SELECT * FROM institutions WHERE id = ?',
      [req.params.id]
    );

    if (institutions.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const [leadership] = await pool.execute(
      'SELECT * FROM institution_leadership WHERE institution_id = ?',
      [req.params.id]
    );

    res.json({
      ...institutions[0],
      leadership: leadership || []
    });
  } catch (error) {
    console.error('Get institution error:', error);
    res.status(500).json({ error: 'Failed to get institution' });
  }
});

// Get all approved institutions (public directory)
router.get('/', async (req, res) => {
  try {
    const { search, state, type } = req.query;

    let query = 'SELECT * FROM institutions WHERE status = "approved"';
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR city LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (state) {
      query += ' AND state = ?';
      params.push(state);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY name ASC';

    const [institutions] = await pool.execute(query, params);
    res.json(institutions);
  } catch (error) {
    console.error('Get institutions error:', error);
    res.status(500).json({ error: 'Failed to get institutions' });
  }
});

// Upload supporting document (PDF, JPG, PNG)
router.post('/upload-document', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { base64Data, filename } = req.body;
    if (!base64Data || !filename) {
      return res.status(400).json({ error: 'Base64 data and filename are required' });
    }

    // Parse base64
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 data format' });
    }

    const fileType = matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');

    // Validate size (5MB max)
    if (dataBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must be under 5MB' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Only PDF, JPG, and PNG formats are allowed' });
    }

    const ext = path.extname(filename) || (fileType === 'application/pdf' ? '.pdf' : fileType === 'image/png' ? '.png' : '.jpg');
    const uploadDir = path.join(import.meta.dirname || __dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFilename = `doc-${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, safeFilename);

    fs.writeFileSync(filepath, dataBuffer);

    const documentUrl = `/uploads/${safeFilename}`;
 
    res.json({ documentUrl });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

export default router;
