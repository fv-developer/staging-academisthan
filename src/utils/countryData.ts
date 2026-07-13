export interface Country {
  code: string;
  name: string;
  dialCode: string;
  phoneRegex: string;
  phonePlaceholder: string;
  pinRegex: string;
  pinPlaceholder: string;
}

export const countries: Country[] = [
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits (e.g. 700123456)', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'AL', name: 'Albania', dialCode: '+355', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'AD', name: 'Andorra', dialCode: '+376', phoneRegex: '^\\d{6}$', phonePlaceholder: '6 digits', pinRegex: '^AD\\d{3}$', pinPlaceholder: 'AD and 3 digits' },
  { code: 'AO', name: 'Angola', dialCode: '+244', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', phoneRegex: '^\\d{10}$', phonePlaceholder: '10 digits (area code + number)', pinRegex: '^[A-Z]?\\d{4}[A-Z]{3}$|^\\d{4}$', pinPlaceholder: '4 digits or e.g. C1024CWN' },
  { code: 'AM', name: 'Armenia', dialCode: '+374', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'AU', name: 'Australia', dialCode: '+61', phoneRegex: '^4\\d{8}$|^\\d{9}$', phonePlaceholder: '9 digits (e.g. 412345678)', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits (e.g. 2000)' },
  { code: 'AT', name: 'Austria', dialCode: '+43', phoneRegex: '^\\d{10,11}$', phonePlaceholder: '10-11 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^AZ\\d{4}$', pinPlaceholder: 'AZ and 4 digits' },
  { code: 'BS', name: 'Bahamas', dialCode: '+1-242', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{5}$|^N-\\d{4}$', pinPlaceholder: '5 digits or N-XXXX' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{3,4}$', pinPlaceholder: '3-4 digits' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', phoneRegex: '^1\\d{9}$', phonePlaceholder: '10 digits (e.g. 1712345678)', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'BB', name: 'Barbados', dialCode: '+1-246', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^BB\\d{5}$', pinPlaceholder: 'BB and 5 digits' },
  { code: 'BY', name: 'Belarus', dialCode: '+375', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', phoneRegex: '^4\\d{8}$|^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'BZ', name: 'Belize', dialCode: '+501', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^[A-Z0-9]{3,8}$', pinPlaceholder: 'Postal code' },
  { code: 'BJ', name: 'Benin', dialCode: '+229', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'BT', name: 'Bhutan', dialCode: '+975', phoneRegex: '^[17]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', phoneRegex: '^\\d{7,8}$', phonePlaceholder: '7-8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', phoneRegex: '^\\d{10,11}$', phonePlaceholder: '10-11 digits (e.g. 11987654321)', pinRegex: '^\\d{5}-\\d{3}$|^\\d{8}$', pinPlaceholder: '8 digits (e.g. 01000-000)' },
  { code: 'BN', name: 'Brunei', dialCode: '+673', phoneRegex: '^[78]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^[A-Z]{2}\\d{4}$', pinPlaceholder: '2 letters and 4 digits' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', phoneRegex: '^\\d{8,9}$', phonePlaceholder: '8-9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', phoneRegex: '^\\d{8,9}$', phonePlaceholder: '8-9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'CA', name: 'Canada', dialCode: '+1', phoneRegex: '^\\d{10}$', phonePlaceholder: '10 digits', pinRegex: '^[A-Z]\\d[A-Z] ?\\d[A-Z]\\d$', pinPlaceholder: 'e.g. K1A 0B1 (A1A 1A1)' },
  { code: 'CV', name: 'Cape Verde', dialCode: '+238', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'CF', name: 'Central African Republic', dialCode: '+236', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'TD', name: 'Chad', dialCode: '+235', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'CL', name: 'Chile', dialCode: '+56', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{7}$', pinPlaceholder: '7 digits (e.g. 8320000)' },
  { code: 'CN', name: 'China', dialCode: '+86', phoneRegex: '^1[3-9]\\d{9}$', phonePlaceholder: '11 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', phoneRegex: '^3\\d{9}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'KM', name: 'Comoros', dialCode: '+269', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'CG', name: 'Congo', dialCode: '+242', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', phoneRegex: '^[86]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'HR', name: 'Croatia', dialCode: '+385', phoneRegex: '^9\\d{7,8}$', phonePlaceholder: '8-9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', phoneRegex: '^5\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'CY', name: 'Cyprus', dialCode: '+357', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{3} ?\\d{2}$', pinPlaceholder: '5 digits (e.g. 110 00)' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'DM', name: 'Dominica', dialCode: '+1-767', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'DO', name: 'Dominican Republic', dialCode: '+1-809', phoneRegex: '^\\d{10}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', phoneRegex: '^1[0-25]\\d{8}$', phonePlaceholder: '10 digits (e.g. 1001234567)', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', phoneRegex: '^[76]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', phoneRegex: '^[17]\\d{6}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'EE', name: 'Estonia', dialCode: '+372', phoneRegex: '^5\\d{6,7}$', phonePlaceholder: '7-8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'FJ', name: 'Fiji', dialCode: '+679', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'FI', name: 'Finland', dialCode: '+358', phoneRegex: '^4\\d{5,9}$', phonePlaceholder: 'Mobile number', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'FR', name: 'France', dialCode: '+33', phoneRegex: '^[67]\\d{8}$', phonePlaceholder: '9 digits (e.g. 612345678)', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits (e.g. 75001)' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', phoneRegex: '^0\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GM', name: 'Gambia', dialCode: '+220', phoneRegex: '^[35679]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GE', name: 'Georgia', dialCode: '+995', phoneRegex: '^5\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'DE', name: 'Germany', dialCode: '+49', phoneRegex: '^1[5-7]\\d{8,9}$', phonePlaceholder: 'Mobile number (e.g. 1701234567)', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits (e.g. 10115)' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', phoneRegex: '^[25]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GR', name: 'Greece', dialCode: '+30', phoneRegex: '^69\\d{8}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{3} ?\\d{2}$', pinPlaceholder: '5 digits' },
  { code: 'GD', name: 'Grenada', dialCode: '+1-473', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', phoneRegex: '^[543]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'GN', name: 'Guinea', dialCode: '+224', phoneRegex: '^6\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', phoneRegex: '^[956]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GY', name: 'Guyana', dialCode: '+592', phoneRegex: '^6\\d{6}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'HT', name: 'Haiti', dialCode: '+509', phoneRegex: '^[34]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^HT\\d{4}$', pinPlaceholder: 'HT and 4 digits' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', phoneRegex: '^[983]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', phoneRegex: '^(20|30|70)\\d{7}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'IS', name: 'Iceland', dialCode: '+354', phoneRegex: '^[678]\\d{6}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{3}$', pinPlaceholder: '3 digits' },
  { code: 'IN', name: 'India', dialCode: '+91', phoneRegex: '^[6-9]\\d{9}$', phonePlaceholder: '10-digit mobile (e.g. 9876543210)', pinRegex: '^[1-9]\\d{5}$', pinPlaceholder: '6 digits (e.g. 110001)' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', phoneRegex: '^8\\d{8,11}$', phonePlaceholder: '9-12 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'IR', name: 'Iran', dialCode: '+98', phoneRegex: '^9\\d{9}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{10}$', pinPlaceholder: '10 digits' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', phoneRegex: '^7\\d{9}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', phoneRegex: '^8[3-9]\\d{7}$', phonePlaceholder: '9 digits', pinRegex: '^[A-Z0-9]{7}$|^[A-Z]\\d{2} ?[A-Z0-9]{4}$', pinPlaceholder: '7 alphanumeric digits (Eircode)' },
  { code: 'IL', name: 'Israel', dialCode: '+972', phoneRegex: '^5\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{7}$|^\\d{5}$', pinPlaceholder: '7 digits (or 5)' },
  { code: 'IT', name: 'Italy', dialCode: '+39', phoneRegex: '^3\\d{9}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits (e.g. 00100)' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1-876', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'JP', name: 'Japan', dialCode: '+81', phoneRegex: '^[789]0\\d{8}$', phonePlaceholder: '10 digits (e.g. 9012345678)', pinRegex: '^\\d{3}-\\d{4}$|^\\d{7}$', pinPlaceholder: '7 digits (e.g. 100-0001)' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', phoneRegex: '^7[7-9]\\d{7}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', phoneRegex: '^7\\d{9}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', phoneRegex: '^[71]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'KP', name: 'Korea (North)', dialCode: '+850', phoneRegex: '^\\d{8,10}$', phonePlaceholder: 'Phone number', pinRegex: '^\\d{3}-\\d{3}$', pinPlaceholder: '6 digits' },
  { code: 'KR', name: 'Korea (South)', dialCode: '+82', phoneRegex: '^10\\d{8}$', phonePlaceholder: '10 digits (e.g. 1012345678)', pinRegex: '^\\d{5}$|^\\d{3}-\\d{3}$', pinPlaceholder: '5 digits (or 3-3 format)' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', phoneRegex: '^[569]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'LA', name: 'Laos', dialCode: '+856', phoneRegex: '^20\\d{8}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'LV', name: 'Latvia', dialCode: '+371', phoneRegex: '^2\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^LV-\\d{4}$', pinPlaceholder: 'LV- and 4 digits' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', phoneRegex: '^[37]\\d{6}$|^[1-9]\\d{7}$', phonePlaceholder: '7-8 digits', pinRegex: '^\\d{4}$|^\\d{8}$', pinPlaceholder: '4 or 8 digits' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{3}$', pinPlaceholder: '3 digits' },
  { code: 'LR', name: 'Liberia', dialCode: '+231', phoneRegex: '^(77|88)\\d{7}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'LY', name: 'Libya', dialCode: '+218', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'LI', name: 'Liechtenstein', dialCode: '+423', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^94\\d{2}$', pinPlaceholder: '94XX' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', phoneRegex: '^6\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^LT-\\\d{5}$|^\\d{5}$', pinPlaceholder: 'LT- and 5 digits' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', phoneRegex: '^6[269]1\\d{6}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', phoneRegex: '^3\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{3}$', pinPlaceholder: '3 digits' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', phoneRegex: '^[89]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', phoneRegex: '^1\\d{8,9}$', phonePlaceholder: '9-10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'MV', name: 'Maldives', dialCode: '+960', phoneRegex: '^[79]\\d{6}$', phonePlaceholder: '7 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'ML', name: 'Mali', dialCode: '+223', phoneRegex: '^[6789]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'MT', name: 'Malta', dialCode: '+356', phoneRegex: '^[79]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^[A-Z]{3} ?\\d{4}$', pinPlaceholder: '3 letters and 4 digits' },
  { code: 'MH', name: 'Marshall Islands', dialCode: '+692', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^969\\d{2}$', pinPlaceholder: '969XX' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', phoneRegex: '^[234]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'MU', name: 'Mauritius', dialCode: '+230', phoneRegex: '^5\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$|^[A-Z0-9]{3,8}$', pinPlaceholder: 'Postal code' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', phoneRegex: '^\\d{10}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'FM', name: 'Micronesia', dialCode: '+691', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^969\\d{2}$', pinPlaceholder: '969XX' },
  { code: 'MD', name: 'Moldova', dialCode: '+373', phoneRegex: '^[67]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^MD-\\d{4}$', pinPlaceholder: 'MD- and 4 digits' },
  { code: 'MC', name: 'Monaco', dialCode: '+377', phoneRegex: '^6\\d{8}$|^\\d{8}$', phonePlaceholder: '8-9 digits', pinRegex: '^980\\d{2}$', pinPlaceholder: '980XX' },
  { code: 'MN', name: 'Mongolia', dialCode: '+976', phoneRegex: '^[985]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'ME', name: 'Montenegro', dialCode: '+382', phoneRegex: '^6\\d{7,8}$', phonePlaceholder: '8-9 digits', pinRegex: '^8\\d{4}$', pinPlaceholder: '8XXXX' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', phoneRegex: '^[67]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', phoneRegex: '^(82|83|84|85|86|87)\\d{7}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', phoneRegex: '^9\\d{7,9}$', phonePlaceholder: '8-10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', phoneRegex: '^8[1-5]\\d{7}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', phoneRegex: '^9\\d{9}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', phoneRegex: '^6\\d{8}$', phonePlaceholder: '9 digits (e.g. 612345678)', pinRegex: '^\\d{4} ?[A-Z]{2}$', pinPlaceholder: '4 digits + 2 letters (e.g. 1012 JS)' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', phoneRegex: '^2\\d{7,9}$', phonePlaceholder: '8-10 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', phoneRegex: '^[875]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'NE', name: 'Niger', dialCode: '+227', phoneRegex: '^\\d{8}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', phoneRegex: '^[789][01]\\d{8}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'NO', name: 'Norway', dialCode: '+47', phoneRegex: '^[49]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'OM', name: 'Oman', dialCode: '+968', phoneRegex: '^9\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{3}$', pinPlaceholder: '3 digits' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', phoneRegex: '^3\\d{9}$', phonePlaceholder: '10 digits (e.g. 3001234567)', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'PW', name: 'Palau', dialCode: '+680', phoneRegex: '^\\d{7}$', phonePlaceholder: '7 digits', pinRegex: '^969\\d{2}$', pinPlaceholder: '969XX' },
  { code: 'PA', name: 'Panama', dialCode: '+507', phoneRegex: '^6\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', phoneRegex: '^[78]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{3}$', pinPlaceholder: '3 digits' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'PE', name: 'Peru', dialCode: '+51', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', phoneRegex: '^9\\d{9}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'PL', name: 'Poland', dialCode: '+48', phoneRegex: '^[5-8]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{2}-\\d{3}$', pinPlaceholder: '5 digits (e.g. 00-001)' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}-\\d{3}$', pinPlaceholder: 'e.g. 1000-090' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', phoneRegex: '^[3567]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'RO', name: 'Romania', dialCode: '+40', phoneRegex: '^7\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'RU', name: 'Russia', dialCode: '+7', phoneRegex: '^9\\d{9}$', phonePlaceholder: '10 digits (e.g. 9123456789)', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', phoneRegex: '^7\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', phoneRegex: '^5\\d{8}$', phonePlaceholder: '9-digit mobile (e.g. 501234567)', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', phoneRegex: '^7[7860]\\d{7}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'RS', name: 'Serbia', dialCode: '+381', phoneRegex: '^6\\d{7,8}$', phonePlaceholder: '8-9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', phoneRegex: '^[89]\\d{7}$', phonePlaceholder: '8-digit mobile', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits (e.g. 189067)' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{3} ?\\d{2}$', pinPlaceholder: '5 digits' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', phoneRegex: '^[34567]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', phoneRegex: '^[6-8]\\d{8}$', phonePlaceholder: '9 digits (e.g. 821234567)', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'ES', name: 'Spain', dialCode: '+34', phoneRegex: '^[67]\\d{8}$', phonePlaceholder: '9-digit mobile', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits (e.g. 28001)' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', phoneRegex: '^7\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'SD', name: 'Sudan', dialCode: '+249', phoneRegex: '^[91]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', phoneRegex: '^7\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{3} ?\\d{2}$', pinPlaceholder: '5 digits (e.g. 111 22)' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', phoneRegex: '^7[4-9]\\d{7}$', phonePlaceholder: '9 digits (e.g. 791234567)', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'SY', name: 'Syria', dialCode: '+963', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{3}(\\d{2})?$', pinPlaceholder: '3 or 5 digits' },
  { code: 'TJ', name: 'Tajikistan', dialCode: '+992', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', phoneRegex: '^[67]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', phoneRegex: '^[689]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', phoneRegex: '^[2459]\\d{7}$', phonePlaceholder: '8 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', phoneRegex: '^5\\d{9}$', phonePlaceholder: '10 digits (e.g. 5321234567)', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', phoneRegex: '^7\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', phoneRegex: '^(39|50|63|66|67|68|73|9[1-9])\\d{7}$', phonePlaceholder: '9-digit mobile', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', phoneRegex: '^5[024568]\\d{7}$', phonePlaceholder: '9 digits (e.g. 501234567)', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', phoneRegex: '^7[1-9]\\d{8}$', phonePlaceholder: '9-digit mobile (e.g. 7712345678)', pinRegex: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$', pinPlaceholder: 'e.g. SW1A 1AA' },
  { code: 'US', name: 'United States', dialCode: '+1', phoneRegex: '^[2-9]\\d{9}$', phonePlaceholder: '10-digit mobile (e.g. 5551234567)', pinRegex: '^\\d{5}(-\\d{4})?$', pinPlaceholder: '5 or 9 digits (e.g. 90210)' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', phoneRegex: '^9\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', phoneRegex: '^\\d{9}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{6}$', pinPlaceholder: '6 digits' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', phoneRegex: '^(412|414|416|424|426)\\d{7}$', phonePlaceholder: '10 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', phoneRegex: '^(3|5|7|8|9)\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'YE', name: 'Yemen', dialCode: '+967', phoneRegex: '^7\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', phoneRegex: '^[97]\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{5}$', pinPlaceholder: '5 digits' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', phoneRegex: '^7\\d{8}$', phonePlaceholder: '9 digits', pinRegex: '^\\d{4}$', pinPlaceholder: '4 digits' }
];

export const stateCities: Record<string, Record<string, string[]>> = {
  'India': {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Tawang'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Munger'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur', 'Durg', 'Ambikapur'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad'],
    'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Nahan', 'Una'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Phusro'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Shivamogga', 'Tumakuru', 'Kalaburagi'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Alappuzha', 'Palakkad', 'Kannur', 'Kottayam'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Chhatrapati Sambhajinagar', 'Solapur', 'Amravati', 'Nanded', 'Kolhapur'],
    'Manipur': ['Imphal', 'Thoubal', 'Kakching', 'Churachandpur'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot', 'Moga'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar', 'Bharatpur'],
    'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda'],
    'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Meerut', 'Varanasi', 'Prayagraj', 'Bareilly', 'Aligarh', 'Noida'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh'],
    'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling', 'Siliguri', 'Asansol', 'Durgapur', 'Bardhaman', 'Malda', 'Kharagpur', 'Kalyani'],
    'Delhi': ['New Delhi', 'North Delhi', 'East Delhi', 'West Delhi', 'South Delhi'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
    'Chandigarh': ['Chandigarh'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua'],
    'Ladakh': ['Leh', 'Kargil']
  },
  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Oakland'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany'],
    'Texas': ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
    'Illinois': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Springfield']
  },
  'Pakistan': {
    'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Multan', 'Bahawalpur', 'Sargodha', 'Sialkot', 'Gujarat', 'Sheikhupura'],
    'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 'Jacobabad'],
    'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Abbottabad', 'Dera Ismail Khan'],
    'Balochistan': ['Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman'],
    'Islamabad Capital Territory': ['Islamabad'],
    'Azad Kashmir': ['Muzaffarabad', 'Mirpur', 'Rawalakot'],
    'Gilgit-Baltistan': ['Gilgit', 'Skardu']
  }
};

export function getMaxPhoneLength(country: Country): number {
  let maxLen = 0;
  const parts = country.phoneRegex.split('|');
  for (const part of parts) {
    let len = 0;
    
    // Count and strip character classes like [6-9]
    const charClasses = part.match(/\[[^\]]+\]/g) || [];
    len += charClasses.length;
    const partWithoutClasses = part.replace(/\[[^\]]+\]/g, '');
    
    // Count and strip quantifiers like \d{9}
    const quantifierMatches = partWithoutClasses.match(/\\[dw]\{(\d+)(?:,(\d+))?\}/g) || [];
    for (const q of quantifierMatches) {
      const qMatch = q.match(/\\[dw]\{(\d+)(?:,(\d+))?\}/);
      if (qMatch) {
        const minVal = parseInt(qMatch[1]);
        const maxVal = qMatch[2] ? parseInt(qMatch[2]) : minVal;
        len += maxVal;
      }
    }
    const partWithoutQuantifiers = partWithoutClasses.replace(/\\[dw]\{(\d+)(?:,(\d+))?\}/g, '');
    
    // Count and strip simple escape sequences like \d and \w
    const simpleEscapes = partWithoutQuantifiers.match(/\\d|\\w/g) || [];
    len += simpleEscapes.length;
    const partWithoutEscapes = partWithoutQuantifiers.replace(/\\d|\\w/g, '');
    
    // Count remaining literal characters (excluding regex operators)
    const literals = partWithoutEscapes.replace(/[\^\$\?\*\+\(\)\|]/g, '');
    len += literals.length;
    
    if (len > maxLen) {
      maxLen = len;
    }
  }

  if (maxLen === 0) {
    const rangeMatch = country.phonePlaceholder.match(/(\d+)-(\d+)\s*digits?/i);
    if (rangeMatch) return parseInt(rangeMatch[2]);
    const singleMatch = country.phonePlaceholder.match(/(\d+)\s*digits?/i);
    if (singleMatch) return parseInt(singleMatch[1]);
    return 15;
  }

  return maxLen;
}

export function getMaxPinLength(country: Country): number {
  let maxLen = 0;
  const parts = country.pinRegex.split('|');
  for (const part of parts) {
    let len = 0;
    
    // Count and strip character classes like [1-9] or [A-Z]
    const charClasses = part.match(/\[[^\]]+\]/g) || [];
    len += charClasses.length;
    const partWithoutClasses = part.replace(/\[[^\]]+\]/g, '');
    
    // Count and strip quantifiers like \d{5} or \w{4}
    const quantifierMatches = partWithoutClasses.match(/\\[dw]\{(\d+)(?:,(\d+))?\}/g) || [];
    for (const q of quantifierMatches) {
      const qMatch = q.match(/\\[dw]\{(\d+)(?:,(\d+))?\}/);
      if (qMatch) {
        const minVal = parseInt(qMatch[1]);
        const maxVal = qMatch[2] ? parseInt(qMatch[2]) : minVal;
        len += maxVal;
      }
    }
    const partWithoutQuantifiers = partWithoutClasses.replace(/\\[dw]\{(\d+)(?:,(\d+))?\}/g, '');
    
    // Count and strip simple escape sequences like \d and \w
    const simpleEscapes = partWithoutQuantifiers.match(/\\d|\\w/g) || [];
    len += simpleEscapes.length;
    const partWithoutEscapes = partWithoutQuantifiers.replace(/\\d|\\w/g, '');
    
    // Count remaining literal characters (excluding regex operators)
    const literals = partWithoutEscapes.replace(/[\^\$\?\*\+\(\)\|]/g, '');
    len += literals.length;
    
    if (len > maxLen) {
      maxLen = len;
    }
  }

  if (maxLen === 0) {
    const singleMatch = country.pinPlaceholder.match(/(\d+)\s*digits?/i);
    if (singleMatch) return parseInt(singleMatch[1]);
    return 10;
  }

  return maxLen;
}

export function getExpectedPhoneLabel(country: Country): string {
  return getMaxPhoneLength(country).toString();
}

export function getExpectedPinLabel(country: Country): string {
  return getMaxPinLength(country).toString();
}
