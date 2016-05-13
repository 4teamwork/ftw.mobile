from ftw.mobile import _
from ftw.mobile.interfaces import IMobileButton
from ftw.mobile.navigation import MobileNavigation
from zope.component import adapts
from zope.component import getMultiAdapter
from zope.interface import implements
from zope.interface import Interface
import json


LINK_TEMPLATE = '''
<a href="{url}"
   data-mobileurl="{data_url}"
   data-mobiletemplate="{mobile_template}"
   data-mobiledata='{data}'>
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
        return json.dumps([])

    def data_url(self):
        """Url for json data"""
        return ''

    def data_template(self):
        return 'ftw-mobile-list-template'

    def position(self):
        raise NotImplementedError("Implement a position (int)")

    def render_button(self):
        return LINK_TEMPLATE.format(url='#',
                                    data_url=self.data_url(),
                                    mobile_template=self.data_template(),
                                    data=self.data(),
                                    label=self.label())


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

    def data(self):
        """json data to display"""
        view = MobileNavigation(self.context, self.request)
        return json.dumps(view())
