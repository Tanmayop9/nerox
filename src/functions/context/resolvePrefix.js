
export const resolvePrefix = async (ctx, noPrefix) => {
    return (ctx.content.startsWith(ctx.client.prefix) ? ctx.client.prefix
        : ctx.content.startsWith(`<@${ctx.client.user.id}>`) ? `${ctx.client.user}`
            : noPrefix ? ''
                : null);
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
