import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { CHS_INTERNAL_API_KEY, INTERNAL_API_URL } from "../config";


/**
 * This class is required because api-sdk-node only offers response type of json,
 * however this service requires response type of array buffer, as well as json.
 * This class deals with offering 'get' request with response type array buffer.
 */
export class ArrayBufferRequestClient {

    /**
    * TODO: Move this code to a better fit for it.
    * This code has been add here due to it being only required by ImageRender's render
    * and other factor
     * @param url path to the endpoint
     * @returns
     */
    async rawGetArrayBuffer(url: string) {
        try {
            const options: AxiosRequestConfig = {
                method: "GET",
                headers: {
                    authorization: CHS_INTERNAL_API_KEY,
                    accept: "application/json",
                    "content-type": "application/json"
                },
                url: `${INTERNAL_API_URL}${url}`,
                data: null,
                responseType: "arraybuffer"
            };

            // any errors (including status code errors) are thrown as exceptions and
            // will be caught in the catch block.
            const resp = await axios(options) as AxiosResponse;
            return {
                status: resp.status,
                body: resp.data,
                headers: resp.headers
            };
        } catch (e) {
            // e can be an instance of AxiosError or a generic error
            // however, we cannot specify a type for e coz type annotations for catch block errors must be 'any' or 'unknown' if specified
            const error = e?.response?.data || { message: "failed to execute http request" };
            return {
                status: e?.status || 500,
                error
            };
        }
    }
}
