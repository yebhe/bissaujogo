from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SuperuserLoginView, MeView, ChangePasswordView

urlpatterns = [
    path('login/',   SuperuserLoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),   # SimpleJWT natif
    path('me/',      MeView.as_view()),
    path('me/password/', ChangePasswordView.as_view()),
]