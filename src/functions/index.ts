interface AoiFunction {
    name: string
    brackets: boolean
    optional: boolean
    fields: {
        name: string
        description: string
        required: boolean
        type: string
        defaultValue?: string
        possibleValues?: string[]
    }[]
    returns: string
    defaultValues: string[]
    description: string
    version: string
    example: string | null
    code(d: any): any
}

const functions: AoiFunction[] = [
    {
        name: "$inviteeInfo",
        description: "Returns the invitee's information.",
        brackets: true,
        optional: true,
        fields: [
            {
                name: "guildId",
                description: "The guild's id",
                type: "string",
                required: false,
                defaultValue: "Guild#id",
            },
            {
                name: "User ID",
                description: "The user's ID.",
                type: "string",
                required: false,
                defaultValue: "User#id",
            },
            {
                name: "Options",
                description: "Invitee options to be retrieved.",
                type: "string",
                required: false,
                defaultValue: "all",
                possibleValues: ["all", "inviter", "code", "fake", "join"],
            },
        ],
        defaultValues: ["d.guild.id", "d.author.id", "all"],
        version: "1.0.0",
        returns: "boolean | object | string",
        example: [
            "$inviteeInfo",
            "$inviteeInfo[$guildID;$authorID;inviter]",
            "$getObjectProperty[name;inviter]\n$createObject[name;$inviteeInfo[$guildID;$authorID;all]]"
        ].join("\n// or"),
        async code(d) {
            const data = d.util.aoiFunc(d)

            const [
                guildId = d.guild?.id,
                userId = d.author?.id,
                option = "all",
            ] = data.inside.splits

            const inviteSystem = d.client.AoiInviteSystem
            if (!inviteSystem) return d.aoiError.fnError(
                d,
                "custom",
                { inside: data.inside },
                "InviteManager is not enabled in this bot!",
            );

            const codeData = await inviteSystem.getInviteeData(userId, guildId)

            const result = codeData ?? {}
            data.result = option === "all"
                ? JSON.stringify(result)
                : option === "fake"
                ? result.isFake ?? false
                : result[option] ?? false

            return {
                code: d.util.setCode(data),
            }
        }
    }
]

export default functions