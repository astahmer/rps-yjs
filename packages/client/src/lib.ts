import { SetState, stringify } from "@pastable/core";
import { useInterpret } from "@xstate/react";
import { MaybeLazy, UseMachineOptions } from "@xstate/react/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { EventObject, Interpreter, InterpreterOptions, MachineOptions, State, StateMachine, Typestate } from "xstate";
import { toObserver } from "xstate/lib/utils";

export function useSharedMachine<
    Data extends object,
    TContext,
    TEvent extends EventObject,
    TTypestate extends Typestate<TContext> = { value: any; context: TContext }
>(
    proxiedYMap: Data,
    getMachine: MaybeLazy<StateMachine<TContext, any, TEvent, TTypestate>>,
    {
        stateKey = "state",
        versionKey = "version",
        stringifyFn,
        ...options
    }: Partial<InterpreterOptions> &
        Partial<UseMachineOptions<TContext, TEvent>> &
        Partial<MachineOptions<TContext, TEvent>> &
        UseSharedMachineOptions = {}
): [
    State<TContext, TEvent, any, TTypestate>,
    Interpreter<TContext, any, TEvent, TTypestate>["send"],
    Interpreter<TContext, any, TEvent, TTypestate>
] {
    const [state, send, service, setState, listener] = useMachineWithSetState(getMachine, options);
    const snapshot = useSnapshot(proxiedYMap);
    const storedState = snapshot[stateKey] as string;

    // Persist current state on Y.Map[stateKey] onTransition if state differs
    const subscribe = () => {
        service.onTransition((updated, _event) => {
            if (areEqualStateValuePath(state as AnyState, updated)) return;

            proxiedYMap[versionKey] = (proxiedYMap[versionKey] || 0) + 1;
            proxiedYMap[stateKey] = stringifyFn?.(updated) || stringify(updated, 0);
        });
    };

    // Subscribe persist onTransition on mount
    useEffect(() => {
        subscribe();
    }, []);

    const localVersionRef = useRef(snapshot[versionKey]);

    // Restarts the machine with the updated machine state stored on the given Y.Map[stateKey]
    // -> Someone else triggered a transition and we need to update the local state
    useEffect(() => {
        let unsub: { unsubscribe: () => void } | undefined;
        if (!storedState) return;

        const updated = parseStateValue(storedState) as any as State<TContext, TEvent, any, TTypestate>;
        if (areEqualStateValuePath(state as AnyState, updated)) return;

        if (snapshot[versionKey] === localVersionRef.current) return;
        localVersionRef.current = snapshot[versionKey];

        service.stop();
        setState(updated);
        service.start(updated);

        // Once the service is restarded we have to manually re-bind the base listener & onTransition listener
        // as it is only done on mount in useInterpreter, itself being in useMachine/useMachineWithSetState
        unsub = service.subscribe(toObserver(listener));
        subscribe();

        return () => {
            unsub?.unsubscribe?.();
        };
    }, [storedState]);

    return [state, send, service];
}
export interface UseSharedMachineOptions {
    /**
     * Y.Map key used to store the stringified state machine
     * @default "state"
     */
    stateKey?: string;
    /**
     * Y.Map key used to store the state machine version
     * @default "version"
     */
    versionKey?: string;
    /** Stringify function used on the current machine state when storing its value in Y.Map[stateKey]  */
    stringifyFn?: (state: unknown) => string;
}

export type AnyState = State<any, any, any, any>;
export const getStateValuePath = (state: AnyState) => state.toStrings().slice(-1)[0];
export const parseStateValue = (stateStr: string) => {
    if (!stateStr) return;

    try {
        const parsed = JSON.parse(stateStr);
        return State.create(parsed);
    } catch (error) {
        return;
    }
};
const areEqualStateValuePath = (a: AnyState, b: AnyState) => getStateValuePath(a) === getStateValuePath(b);

// Copy/pasted from https://github.com/statelyai/xstate/blob/main/packages/xstate-react/src/useMachine.ts
// The only difference is the setState exposed as 4th arg
function useMachineWithSetState<
    TContext,
    TEvent extends EventObject,
    TTypestate extends Typestate<TContext> = { value: any; context: TContext }
>(
    getMachine: MaybeLazy<StateMachine<TContext, any, TEvent, TTypestate>>,
    options: Partial<InterpreterOptions> &
        Partial<UseMachineOptions<TContext, TEvent>> &
        Partial<MachineOptions<TContext, TEvent>> = {}
): [
    State<TContext, TEvent, any, TTypestate>,
    Interpreter<TContext, any, TEvent, TTypestate>["send"],
    Interpreter<TContext, any, TEvent, TTypestate>,
    SetState<State<TContext, TEvent, any, TTypestate>>,
    (nextState: State<TContext, TEvent, any, TTypestate>) => void
] {
    const listener = useCallback((nextState: State<TContext, TEvent, any, TTypestate>) => {
        // Only change the current state if:
        // - the incoming state is the "live" initial state (since it might have new actors)
        // - OR the incoming state actually changed.
        //
        // The "live" initial state will have .changed === undefined.
        const initialStateChanged = nextState.changed === undefined && Object.keys(nextState.children).length;

        if (nextState.changed || initialStateChanged) {
            setState(nextState);
        }
    }, []);

    const service = useInterpret(getMachine, options, listener);

    const [state, setState] = useState(() => {
        const { initialState } = service.machine;
        return (options.state ? State.create(options.state) : initialState) as State<TContext, TEvent, any, TTypestate>;
    });

    return [state, service.send, service, setState, listener];
}
