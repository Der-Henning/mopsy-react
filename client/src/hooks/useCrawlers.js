import { useCallback } from "react";
import { useMountedState } from "./"
import Axios from "axios";

export default function useCrawlers(api) {
    const isMounted = useMountedState();

    const fetchCrawlers = useCallback(() => {
        return new Promise((resolve, reject) => {
            Axios.get(api + "/crawler")
                .then((res) => {
                    if (isMounted) {
                        resolve(res.data);
                    }
                })
                .catch((err) => {
                    if (isMounted) reject(err)
                })
        })
    }, [api, isMounted])

    const startCrawler = useCallback(crawlerId => {
        return new Promise((resolve, reject) => {
            Axios.get(api + `/crawler/${crawlerId}/start`)
            .then((res) => {
                if (isMounted) {
                    resolve(res.data);
                }
            })
            .catch((err) => {
                if (isMounted) reject(err)
            })
        })
    }, [api, isMounted])
    
    const stopCrawler = useCallback(crawlerId => {
        return new Promise((resolve, reject) => {
            Axios.get(api + `/crawler/${crawlerId}/stop`)
            .then((res) => {
                if (isMounted) {
                    resolve(res.data);
                }
            })
            .catch((err) => {
                if (isMounted) reject(err)
            })
        })
    }, [api, isMounted])

    const toggleAutorestart = useCallback(crawlerId => {
        return new Promise((resolve, reject) => {
            Axios.get(api + `/crawler/${crawlerId}/toggleAutorestart`)
            .then((res) => {
                if (isMounted) {
                    resolve(res.data);
                }
            })
            .catch((err) => {
                if (isMounted) reject(err)
            })
        })
    }, [api, isMounted])

    return {
        fetchCrawlers,
        startCrawler,
        stopCrawler,
        toggleAutorestart
    }
}