# views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .serializers import SuperuserTokenSerializer, MeSerializer, ChangePasswordSerializer


@csrf_exempt
def google_auth_callback(request):
    return JsonResponse({"message": "Callback reçu"}, status=200)


class SuperuserLoginView(TokenObtainPairView):
    serializer_class = SuperuserTokenSerializer


class MeView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(MeSerializer(request.user).data)

    def patch(self, request):
        serializer = MeSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        if not request.user.check_password(old_password):
            return Response({'old_password': "Mot de passe actuel incorrect."}, status=400)

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'ok': True})