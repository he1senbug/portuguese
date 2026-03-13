import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/learn', pathMatch: 'full' },
    {
        path: 'auth',
        canActivate: [noAuthGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'register',
                loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
            },
            { path: '', redirectTo: 'login', pathMatch: 'full' },
        ]
    },
    {
        path: 'onboarding',
        canActivate: [authGuard],
        loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent)
    },
    {
        path: 'learn',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./features/learn/topics-list/topics-list.component').then(m => m.TopicsListComponent)
            },
            {
                path: ':topicId',
                loadComponent: () => import('./features/learn/topic-detail/topic-detail.component').then(m => m.TopicDetailComponent)
            },
            {
                path: ':topicId/exam',
                loadComponent: () => import('./features/exam/exam.component').then(m => m.ExamComponent),
                data: { mode: 'learn' }
            },
        ]
    },
    {
        path: 'exam/:mode',
        canActivate: [authGuard],
        loadComponent: () => import('./features/exam/exam.component').then(m => m.ExamComponent)
    },
    {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
    },
    { path: '**', redirectTo: '/learn' },
];
