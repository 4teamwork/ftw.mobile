from ftw.mobile.interfaces import IMobileButton
from plone.app.layout.viewlets.common import ViewletBase
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from zope.component import getAdapters


class MobileButtonViewlet(ViewletBase):

    template = ViewPageTemplateFile('templates/buttons_viewlet.pt')

    def index(self):
        return self.template()

    def buttons(self):
        buttons = list(getAdapters((self.context, self.request),
                                   IMobileButton))
        self.sort_buttons(buttons)

        for name, button in buttons:
            yield {'html': button.render_button(),
                   'name': name}

    def sort_buttons(self, buttons):
        buttons.sort(lambda name, adapter: adapter.position())
        return None
