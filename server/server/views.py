from django.shortcuts import render

def index(request):
    """
    Generate the template info so we can serve the front end.
    """

    return render(request, 'index.html')
