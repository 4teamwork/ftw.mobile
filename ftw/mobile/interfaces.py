from zope.interface import Interface


class IMobileLayer(Interface):
    """Browserlayer marker interface for ftw.mobile"""


class IMobileButton(Interface):

    def __init__(context, request):
        """Adapts context and request"""

    def label():
        """Label of button"""

    def data():
        """json data to display"""

    def data_url(self):
        """Url to call for json data"""
        return '#'

    def position():
        """defines the order of the mobile buttons"""

    def render_button():
        """Link representation"""
