from django.shortcuts import render


class BlockApiBrowserNavigationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            accept = request.headers.get('Accept', '')
            requested_with = request.headers.get('X-Requested-With', '')
            is_browser_navigation = (
                request.method == 'GET'
                and 'text/html' in accept
                and requested_with != 'XMLHttpRequest'
            )
            if is_browser_navigation:
                return render(request, 'index.html', status=200)

        return self.get_response(request)
