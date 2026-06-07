"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('auth_user.urls')),  # Routes d'authentification
    path('api/', include('reservation.urls')),  # Routes de l'application de réservation
    path('assets/<path:path>', serve, {'document_root': settings.FRONTEND_DIST / 'assets'}),
    path('photos/<path:path>', serve, {'document_root': settings.FRONTEND_DIST / 'photos'}),
    path('videos/<path:path>', serve, {'document_root': settings.FRONTEND_DIST / 'videos'}),
    path('favicon.svg', serve, {'document_root': settings.FRONTEND_DIST, 'path': 'favicon.svg'}),
    path('icons.svg', serve, {'document_root': settings.FRONTEND_DIST, 'path': 'icons.svg'}),
    path('robots.txt', serve, {'document_root': settings.FRONTEND_DIST, 'path': 'robots.txt'}),
    path('sitemap.xml', serve, {'document_root': settings.FRONTEND_DIST, 'path': 'sitemap.xml'}),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path('', TemplateView.as_view(template_name='index.html')),
    path('<path:path>', TemplateView.as_view(template_name='index.html')),
]
