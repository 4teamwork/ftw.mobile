from plone import api
from Products.CMFPlone.browser.navigation import get_view_url
from Products.Five.browser import BrowserView


def is_external_link(brain):
    if brain.portal_type == 'Link':
        url = brain.getRemoteUrl
        return not url.startswith(api.portal.get().absolute_url())
    else:
        return False


class MobileNavigation(BrowserView):
    """Compute navigation based on global settings and some given paramters.
    The return value is always a nested structure, which can be represented
    as json.

    Node representation:
     {'title': '<String>',
      'description': '<String>',
      'id' <String>:
      'url': '<String>',
      'externallink': '<Boolean>'}
    """

    def __call__(self):
        return map(self.brain_to_node, self.get_brains())

    def get_brains(self):
        catalog = api.portal.get_tool('portal_catalog')
        return [brain for brain in catalog(self.get_query())
                if not brain.exclude_from_nav]

    def get_query(self):
        portal_types = api.portal.get_tool('portal_types')
        portal_properties = api.portal.get_tool('portal_properties')
        navtree_properties = getattr(portal_properties, 'navtree_properties')

        exclude_types = getattr(navtree_properties, 'metaTypesNotToList', None)
        include_types = list(set(portal_types.keys()) - set(exclude_types))

        sort_on = getattr(navtree_properties,
                          'sortAttribute',
                          'getObjPositionInParent')

        sort_order = getattr(navtree_properties,
                             'sortOrder',
                             'asc')

        query = {'portal_type': include_types,
                 'sort_on': sort_on,
                 'sort_order': sort_order,
                 'is_default_page': False}
        return query

    def brain_to_node(self, brain):
        return {'title': brain.Title,
                'id': brain.id,
                'description': brain.Description,
                'url': get_view_url(brain)[1],
                'externallink': is_external_link(brain)}
