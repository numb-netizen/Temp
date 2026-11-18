from urllib.parse import urlsplit

ORIGIN = 'http://127.0.0.1:19829/'

def classify(url):
    try:
        parsed = urlsplit(url)
        if parsed.username is not None or parsed.password is not None:
            return 'deny'
        if parsed.scheme == 'http' and parsed.hostname == '127.0.0.1' and parsed.port == 19829:
            return 'internal'
        if parsed.scheme in ('https', 'http', 'mailto', 'tel'):
            return 'external'
    except ValueError:
        pass
    return 'deny'
