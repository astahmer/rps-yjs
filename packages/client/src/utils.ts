import { findBy, getRandomIntIn } from "@pastable/core";
import { nanoid } from "nanoid";
import { Game, Player } from "./types";

export const makeId = () => nanoid(12);
export const makeUsername = () => nanoid(getRandomIntIn(4, 10));
export const makePlayer = (): Player => ({
    id: makeId(),
    username: makeUsername(),
    elo: getRandomIntIn(0, 2200),
});
export const makeGame = (): Game => ({ id: makeId(), players: [makePlayer()], mode: "duel" });
export const getRandomColor = () => rainbow(getRandomIntIn(100) % 999);
export const removeItemObjectMutate = <T>(array: T[], idPath: string, value: T): T[] =>
    array.splice(findBy(array, idPath, value, true) as number, 1);

export function rainbow(step: number, numOfSteps = 1000) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    let r = 0,
        g = 0,
        b = 0;
    let h = step / numOfSteps;
    let i = ~~(h * 6);
    let f = h * 6 - i;
    let q = 1 - f;
    switch (i % 6) {
        case 0:
            r = 1;
            g = f;
            b = 0;
            break;
        case 1:
            r = q;
            g = 1;
            b = 0;
            break;
        case 2:
            r = 0;
            g = 1;
            b = f;
            break;
        case 3:
            r = 0;
            g = q;
            b = 1;
            break;
        case 4:
            r = f;
            g = 0;
            b = 1;
            break;
        case 5:
            r = 1;
            g = 0;
            b = q;
            break;
    }
    var c =
        "#" +
        ("00" + (~~(r * 255)).toString(16)).slice(-2) +
        ("00" + (~~(g * 255)).toString(16)).slice(-2) +
        ("00" + (~~(b * 255)).toString(16)).slice(-2);
    return c;
}

// https://gist.github.com/beaucharman/e46b8e4d03ef30480d7f4db5a78498ca
export function throttle(callback, wait, immediate = false) {
    let timeout = null;
    let initialCall = true;

    return function () {
        const callNow = immediate && initialCall;
        const next = () => {
            callback.apply(this, arguments);
            timeout = null;
        };

        if (callNow) {
            initialCall = false;
            next();
        }

        if (!timeout) {
            timeout = setTimeout(next, wait);
        }
    };
}
