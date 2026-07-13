import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageViewTracker } from "@/components/PageViewTracker";
import { ScrollToTop } from "@/components/ScrollToTop";

import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Events from "./pages/Events.tsx";
import AIForEducators from "./pages/events/AIForEducators.tsx";
import TeacherAwards from "./pages/events/TeacherAwards.tsx";
import NEPRoundtable from "./pages/events/NEPRoundtable.tsx";
import NewAgeTools from "./pages/events/NewAgeTools.tsx";
import HeroPreview from "./pages/HeroPreview.tsx";
import NotFound from "./pages/NotFound.tsx";
import Programs from "./pages/Programs.tsx";
import News from "./pages/News.tsx";
import Resources from "./pages/Resources.tsx";
import CASPromotionFAQ from "./pages/CASPromotionFAQ.tsx";
import Contact from "./pages/Contact.tsx";
import Jobs from "./pages/Jobs.tsx";
import Gazette from "./pages/Gazette.tsx";
import Directory from "./pages/Directory.tsx";
import VerifyCertificate from "./pages/VerifyCertificate.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import AutonomousColleges from "./pages/AutonomousColleges.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import DraftRegulations2025 from "./pages/DraftRegulations2025.tsx";

import APIScoreCalculator from "./pages/tools/APIScoreCalculator.tsx";
import PromotionChecker from "./pages/tools/PromotionChecker.tsx";
import ResearchScoreCalculator from "./pages/tools/ResearchScoreCalculator.tsx";
import AcademicCV from "./pages/tools/AcademicCV.tsx";
import NotableContributions from "./pages/tools/NotableContributions.tsx";
import ScholarImpact from "./pages/tools/ScholarImpact.tsx";
import TeacherTools from "./pages/tools/TeacherTools.tsx";
import JournalQualityChecker from "./pages/tools/JournalQualityChecker.tsx";
import NAACSelfAssessment from "./pages/tools/NAACSelfAssessment.tsx";
import PBASFormFiller from "./pages/tools/PBASFormFiller.tsx";
import PlagiarismDisclosure from "./pages/tools/PlagiarismDisclosure.tsx";

import ProgramsListing from "./pages/ProgramsListing.tsx";
import ProgramDetail from "./pages/ProgramDetail.tsx";
import UpcomingEvents from "./pages/UpcomingEvents.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import EventPass from "./pages/EventPass.tsx";

import InstitutionRegister from "./pages/InstitutionRegister.tsx";
import SignUp from "./pages/auth/SignUp.tsx";
import SignIn from "./pages/auth/SignIn.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import ResetPassword from "./pages/auth/ResetPassword.tsx";
import VerifyEmail from "./pages/auth/VerifyEmail.tsx";
import VerifyEmailPage from "./pages/VerifyEmail.tsx";
import ResendVerification from "./pages/ResendVerification.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <PageViewTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/ai-for-educators" element={<AIForEducators />} />
            <Route path="/programs/ai-for-educators" element={<AIForEducators />} />
            <Route path="/events/teacher-awards-2021" element={<TeacherAwards />} />
            <Route path="/events/nep-2020-roundtable" element={<NEPRoundtable />} />
            <Route path="/programs/nep-2020-roundtable" element={<NEPRoundtable />} />
            <Route path="/events/new-age-tools-2020" element={<NewAgeTools />} />
            <Route path="/hero-preview" element={<HeroPreview />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/news" element={<News />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/cas-promotion-faq" element={<CASPromotionFAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/gazette" element={<Gazette />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/autonomous" element={<AutonomousColleges />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/regulations/draft-2025" element={<DraftRegulations2025 />} />


            {/* Teacher Tools */}
            <Route path="/tools" element={<TeacherTools />} />
            <Route path="/tools/api-score" element={<APIScoreCalculator />} />
            <Route path="/tools/promotion-check" element={<PromotionChecker />} />
            <Route path="/tools/research-score" element={<ResearchScoreCalculator />} />
            <Route path="/tools/academic-cv" element={<AcademicCV />} />
            <Route path="/tools/notable-contributions" element={<NotableContributions />} />
            <Route path="/tools/scholar-impact" element={<ScholarImpact />} />
            <Route path="/tools/journal-checker" element={<JournalQualityChecker />} />
            <Route path="/tools/naac-self-assessment" element={<NAACSelfAssessment />} />
            <Route path="/tools/pbas-form" element={<PBASFormFiller />} />
            <Route path="/tools/plagiarism-disclosure" element={<PlagiarismDisclosure />} />

            {/* Programs / Learning */}
            <Route path="/learn" element={<ProgramsListing />} />
            <Route path="/learn/:slug" element={<ProtectedRoute><ProgramDetail /></ProtectedRoute>} />
            <Route path="/upcoming-events" element={<UpcomingEvents />} />
            <Route path="/upcoming-events/:slug" element={<EventDetail />} />
            <Route path="/event-pass/:passCode" element={<EventPass />} />

            {/* Institution */}
            <Route path="/institution-register" element={<InstitutionRegister />} />

            {/* Auth */}
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/verify" element={<VerifyEmail />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            <Route path="/auth/resend-verification" element={<ResendVerification />} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/:tab" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
