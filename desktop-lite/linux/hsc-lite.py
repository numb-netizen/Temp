#!/usr/bin/python3
"""Linux system-WebKit wrapper. The loopback server serves only bundled static files."""
import os
import pathlib
import sys
import tempfile
import threading
import http.server
import functools
from policy import ORIGIN, classify
import gi
gi.require_version('Gtk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, WebKit2, GLib

ROOT = pathlib.Path(__file__).resolve().parent / 'site'
SMOKE = '--smoke' in sys.argv

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *args):
        pass
    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

class Window(Gtk.Window):
    def __init__(self):
        super().__init__(title='HSC 2027 Lite')
        self.set_default_size(1200, 800)
        self.set_size_request(320, 480)
        self.connect('destroy', Gtk.main_quit)
        data_dir = tempfile.mkdtemp(prefix='hsc-lite-test-') if SMOKE else os.path.join(GLib.get_user_data_dir(), 'hsc2027-lite')
        manager = WebKit2.WebsiteDataManager(base_data_directory=data_dir, base_cache_directory=os.path.join(data_dir, 'cache'))
        context = WebKit2.WebContext.new_with_website_data_manager(manager)
        self.web = WebKit2.WebView.new_with_context(context)
        self.web.get_settings().set_enable_developer_extras(False)
        self.web.connect('decide-policy', self.decide)
        self.web.connect('permission-request', lambda _view, req: (req.deny(), True)[1])
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        toolbar = Gtk.Box(spacing=5)
        for label, action in [('হোম', lambda: self.web.load_uri(ORIGIN+'index.html')), ('পেছনে', self.web.go_back), ('সামনে', self.web.go_forward), ('রিলোড', self.web.reload)]:
            btn = Gtk.Button(label=label)
            btn.connect('clicked', lambda _button, fn=action: fn())
            toolbar.pack_start(btn, False, False, 0)
        box.pack_start(toolbar, False, False, 0)
        box.pack_start(self.web, True, True, 0)
        self.add(box)
        if SMOKE:
            self.stage = 0
            self.web.connect('load-changed', self.smoke_loaded)
            GLib.timeout_add_seconds(30, self.timeout)
        self.web.load_uri(ORIGIN+'index.html')

    def decide(self, view, decision, kind):
        if kind not in (WebKit2.PolicyDecisionType.NAVIGATION_ACTION, WebKit2.PolicyDecisionType.NEW_WINDOW_ACTION):
            return False
        url = decision.get_navigation_action().get_request().get_uri()
        kind_url = classify(url)
        if kind_url == 'internal':
            if kind == WebKit2.PolicyDecisionType.NEW_WINDOW_ACTION:
                decision.ignore()
                view.load_uri(url)
                return True
            return False
        decision.ignore()
        if kind_url == 'external' and not SMOKE:
            try: Gtk.show_uri_on_window(self, url, Gtk.get_current_event_time())
            except Exception: pass
        return True

    def timeout(self):
        print('Smoke test timed out', file=sys.stderr)
        os._exit(1)

    def smoke_loaded(self, view, event):
        if event != WebKit2.LoadEvent.FINISHED: return
        if self.stage == 0:
            self.stage = 1
            view.run_javascript("localStorage.setItem('hsc2027:physics:0','1'); localStorage.setItem('site:theme','light');", None, self.seeded, None)
        elif self.stage == 1:
            self.stage = 2
            js = "localStorage.getItem('hsc2027:physics:0') === '1' && document.querySelector('[data-subject=physics][data-chapter=\"0\"]').classList.contains('done') && document.documentElement.dataset.theme === 'light'"
            view.run_javascript(js, None, self.checked, None)
    def seeded(self, view, result, _):
        try:
            view.run_javascript_finish(result)
            view.load_uri(ORIGIN+'tracker.html')
        except Exception as ex:
            print(ex, file=sys.stderr); os._exit(1)
    def checked(self, view, result, _):
        try:
            if not view.run_javascript_finish(result).get_js_value().to_boolean(): raise RuntimeError('Tracker or theme failed')
            print('Linux offline tracker and theme smoke passed', flush=True)
            Gtk.main_quit()
        except Exception as ex:
            print(ex, file=sys.stderr); os._exit(1)

if __name__ == '__main__':
    if not (ROOT / 'index.html').is_file():
        sys.exit('Bundled site is missing')
    try:
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 19829), functools.partial(Handler))
    except OSError as ex:
        sys.exit('Cannot start local server (is HSC 2027 Lite already open?): ' + str(ex))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    win = Window()
    win.show_all()
    Gtk.main()
    server.shutdown()
