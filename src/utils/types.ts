import { Resource } from "@companieshouse/api-sdk-node";

export function isResource(o: unknown): o is Resource<unknown> {
    if (o === undefined || o === null) {
        return false;
    }

    if (typeof o !== 'object') {
        return false;
    }

    return 'resource' in o;
}
