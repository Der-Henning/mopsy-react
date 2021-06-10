import { useState, useEffect, useCallback } from "react";
import { useMountedState } from "./"
import Axios from "axios";

export default function useAPI(api) {
    const [user, _setUser] = useState({ loggedIn: false, admin: false })
    const isMounted = useMountedState();

    const setState = useCallback((request) => {
        return new Promise((resolve, reject) => {
            request
                .then((res) => {
                    if (isMounted) {
                        if (res.data) _setUser(res.data);
                        resolve();
                    }
                })
                .catch((err) => {
                    if (isMounted) reject(err)
                })
        })
    }, [isMounted])

    useEffect(() => {
        Axios.get(api + "/user")
            .then(res => {
                if (isMounted) _setUser(res.data);
            })
            .catch(err => {
                console.log(err)
            })
    }, [api, isMounted])

    const login = useCallback(data => {
        return setState(Axios.post(api + "/user/login", data))
    }, [api, setState]);

    const register = useCallback(data => {
        return setState(Axios.post(api + "/user/register", data))
    }, [api, setState]);

    const getUserData = useCallback(() => {
        return Axios.get(api + "/user/data")
    }, [api])

    const setUserData = useCallback((data) => {
        return Axios.put(api + "/user/data", data)
    }, [api])

    const sendMail = useCallback((situation, email) => {
        return Axios.post(api + "/user/" + situation, { email: email })
    }, [api])

    const getFavorites = useCallback(() => {
        return new Promise((resolve, reject) => {
            Axios.get(api + "/favorite")
                .then(res => {
                    resolve(res.data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }, [api])

    const toggleFavorites = useCallback((DocId) => {
        return new Promise((resolve, reject) => {
            Axios.put(api + "/favorite/" + DocId)
                .then(res => {
                    resolve(res.data)
                })
                .catch(err => {
                    reject(err)
                })
        })
    }, [api])

    const logout = useCallback(() => {
        return new Promise((resolve, reject) => {
            Axios.get(api + "/user/logout")
                .then(res => {
                    if (isMounted) {
                        _setUser({ loggedIn: false, admin: false })
                        resolve()
                    }
                })
                .catch(err => {
                    if (isMounted) reject(err)
                })
        })
    }, [api, isMounted]);

    return {
        user,
        login,
        logout,
        register,
        getUserData,
        setUserData,
        getFavorites,
        toggleFavorites,
        sendMail
    }
}