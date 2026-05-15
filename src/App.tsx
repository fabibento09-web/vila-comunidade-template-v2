import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Feed from './pages/Feed'
import SpacePage from './pages/SpacePage'
import PostDetailPage from './pages/PostDetailPage'
import NotFound from './pages/NotFound'
import DraftsPage from './pages/DraftsPage'
import SpacesListPage from './pages/SpacesListPage'
import MembersPage from './pages/MembersPage'
import CoursesPage from './pages/CoursesPage'
import EventsPage from './pages/EventsPage'
import ProfilePage from './pages/ProfilePage'
import ProfileEditPage from './pages/ProfileEditPage'
import VilaSettingsPage from './pages/VilaSettingsPage'
import Layout from './components/Layout'
import InvitePage from './pages/InvitePage'
import CourseDetailPage from './pages/CourseDetailPage'
import UserAccessPage from './pages/UserAccessPage'
import CourseEditPage from './pages/CourseEditPage'
import CourseAnalyticsPage from './pages/CourseAnalyticsPage'
import LessonPlayerPage from './pages/LessonPlayerPage'
import { AuthProvider } from './hooks/use-auth'
import { ComposerProvider } from './hooks/use-composer'
import { PostComposer } from './components/PostComposer'

const App = () => (
  <AuthProvider>
    <ComposerProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/convite/:token" element={<InvitePage />} />
            <Route path="/cursos/:slug/aula/:aulaSlug" element={<LessonPlayerPage />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/e/:slug" element={<SpacePage />} />
              <Route path="/p/:id" element={<PostDetailPage />} />
              <Route path="/rascunhos" element={<DraftsPage />} />
              <Route path="/espacos" element={<SpacesListPage />} />
              <Route path="/membros" element={<MembersPage />} />
              <Route path="/cursos" element={<CoursesPage />} />
              <Route path="/cursos/:slug" element={<CourseDetailPage />} />
              <Route path="/cursos/:slug/editar" element={<CourseEditPage />} />
              <Route path="/cursos/:slug/analytics" element={<CourseAnalyticsPage />} />
              <Route path="/eventos" element={<EventsPage />} />
              <Route path="/u/:id" element={<ProfilePage />} />
              <Route path="/configuracoes/perfil" element={<ProfileEditPage />} />
              <Route path="/configuracoes/vila" element={<VilaSettingsPage />} />
              <Route path="/admin/usuarios/:id" element={<UserAccessPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PostComposer />
        </TooltipProvider>
      </BrowserRouter>
    </ComposerProvider>
  </AuthProvider>
)

export default App
