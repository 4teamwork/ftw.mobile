from ftw.mobile import _
from ftw.mobile.interfaces import IMobileButton
from zope.component import adapts
from zope.component import getMultiAdapter
from zope.interface import implements
from zope.interface import Interface
import json


LINK_TEMPLATE = '''
<a href="{url}"
   data-mobile_endpoint="{endpoint}"
   data-mobile_startup_cachekey="{startup_cachekey}"
   data-mobile_template="{mobile_template}"
   data-mobile_data='{data}'>
    {label}
</a>
'''


class BaseButton(object):
    implements(IMobileButton)
    adapts(Interface, Interface)

    def __init__(self, context, request):
        """Adapts context and request"""
        self.context = context
        self.request = request

    def label(self):
        """Label of button"""
        raise NotImplementedError("Implement a label for the button")

    def data(self):
        """json data to display"""
        return ''

    def endpoint(self):
        """Viewname of the mobile navigation endpoint.
        """
        return ''

    def data_template(self):
        return 'ftw-mobile-list-template'

    def position(self):
        raise NotImplementedError("Implement a position (int)")

    def startup_cachekey(self):
        return ''

    def render_button(self):
        return LINK_TEMPLATE.format(url='#',
                                    startup_cachekey=self.startup_cachekey(),
                                    mobile_template=self.data_template(),
                                    data=self.data(),
                                    label=self.label(),
                                    endpoint=self.endpoint())


class UserButton(BaseButton):

    def label(self):
        return _(u"User menu")

    def position(self):
        return 1000

    def data(self):
        """json data to display"""
        context_state = getMultiAdapter((self.context, self.request),
                                        name=u'plone_context_state')

        user_actions = context_state.actions('user')

        def link_data(item):
            return {'url': item.get('url'),
                    'label': item.get('title')}
        return json.dumps(map(link_data, user_actions))


class NavigationButton(BaseButton):

    def label(self):
        return _(u"Mobile navigation")

    def position(self):
        return 100

    def data_template(self):
        return 'ftw-mobile-navigation-template'

    def endpoint(self):
        return '@@mobilenav'

    def startup_cachekey(self):
        return self.context.restrictedTraverse('@@mobilenav').get_startup_cachekey()
