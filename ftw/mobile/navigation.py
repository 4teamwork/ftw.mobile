from functools import partial
from plone import api
from plone.app.layout.navigation.interfaces import INavigationRoot
from Products.CMFPlone.browser.navigation import get_view_url
from Products.Five.browser import BrowserView
import json
import logging


LOG = logging.getLogger('ftw.mobile')


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

    def startup(self):
        """Return all nodes relevant for starting up a mobile navigation
        on the current context.
        """
        query = self.get_default_query()
        query['path'] = {'query': list(self.parent_paths_to_nav_root()),
                         'depth': 3}
        return json.dumps(self.get_nodes_by_query(query))

    def children(self):
        """Return all nodes
        """
        query = self.get_default_query()
        query['path'] = {'query': '/'.join(self.context.getPhysicalPath()),
                         'depth': int(self.request.get('depth', 2))}
        return json.dumps(self.get_nodes_by_query(query))

    def parent_paths_to_nav_root(self):
        """Generator of the paths of all parents up to the navigation_root.
        """
        for obj in self.context.aq_chain:
            yield '/'.join(obj.getPhysicalPath())
            if INavigationRoot.providedBy(obj):
                return

    def get_nodes_by_query(self, query):
        nodes = map(self.brain_to_node, self.get_brains(query))
        map(partial(self.set_children_loaded_flag, query), nodes)
        return nodes

    def get_brains(self, query):
        catalog = api.portal.get_tool('portal_catalog')
        brains = catalog(query)

        warnsize = 500
        if len(brains) > warnsize:
            LOG.warning('Query results in more than {} results ({})'
                            .format(warnsize, len(brains)))

        return [brain for brain in brains
                if not brain.exclude_from_nav]

    def get_default_query(self):
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
                'absolute_path': brain.getPath(),
                'externallink': is_external_link(brain)}

    def set_children_loaded_flag(self, query, node):
        if (not isinstance(query.get('path', None), dict)
            or 'depth' not in query.get('path', {})):
            # Since we have no path depth limitation we assume that all
            # items were provided in a single response, thus
            # all children are assumed to be loaded.
            node['children_loaded'] = True
            return

        depth = query['path']['depth']
        if depth == -1:
            # Since we have no path depth limitation we assume that all
            # items were provided in a single response, thus
            # all children are assumed to be loaded.
            node['children_loaded'] = True
            return

        path_partials = node['absolute_path'].split('/')
        for _ in range(depth - 1):
            path_partials.pop()

        if '/'.join(path_partials) in query['path']['query']:
            node['children_loaded'] = True
