type Options =  {signal?: AbortSignal}

/** Extended version of onMessage that supports signal for aborting the listener */
export const onMessageExt = (options: Options, ...args: Parameters<typeof onMessage>) => {
    const dismiss = onMessage(...args)
    options?.signal?.addEventListener("abort", dismiss)
    return dismiss
}