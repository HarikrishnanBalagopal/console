import { useLocation } from "react-router-dom";
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';

export const getImportYAMLPath = (activeNamespace: string): string =>
    formatNamespacedRouteForResource('import', activeNamespace);

export const useOnYamlEditPage = (activeNamespace: string): boolean => {
    const location = useLocation();
    // console.log('firing useOnYamlEditPage', location.pathname);
    const urlPath = getImportYAMLPath(activeNamespace);
    return location.pathname === urlPath || location.pathname.endsWith('/yaml');
};
