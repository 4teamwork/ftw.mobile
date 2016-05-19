from ftw.mobile.interfaces import IMobileButton
from plone import api
from plone.app.layout.viewlets.common import ViewletBase
from Products.Five.browser.pagetemplatefile import ViewPageTemplateFile
from zope.component import getAdapters
from zope.component import getMultiAdapter


class MobileButtonViewlet(ViewletBase):

    template = ViewPageTemplateFile('templates/buttons_viewlet.pt')

    def index(self):
        return self.template()

    def buttons(self):
        buttons = list(getAdapters((self.context, self.request),
                                   IMobileButton))

        buttons.sort(key=self.sort_buttons)

        for name, button in buttons:
            if button.available():
                yield {'html': button.render_button(),
                       'name': name}

    def sort_buttons(self, button):
        return button[1].position()

    def nav_root_url(self):
        return api.portal.get_navigation_root(self.context).absolute_url()

    def current_url(self):
        context_state = getMultiAdapter((self.context, self.request),
                                        name=u'plone_context_state')
        return context_state.canonical_object().absolute_url()
