# serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import PermissionDenied

User = get_user_model()

class SuperuserTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_superuser:
            raise PermissionDenied('Superuser requis')
        return data

class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'is_superuser', 'date_joined', 'last_login']

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs.get('new_password') != attrs.get('new_password_confirm'):
            raise serializers.ValidationError({'new_password_confirm': "Les mots de passe ne correspondent pas."})
        if attrs.get('new_password') and len(attrs['new_password']) < 8:
            raise serializers.ValidationError({'new_password': "Le mot de passe doit contenir au moins 8 caractères."})
        return attrs