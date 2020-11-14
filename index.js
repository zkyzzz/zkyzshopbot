const { create, Client } = require('@open-wa/wa-automate')
const { color } = require('./utils')
const options = require('./utils/options')
const msgHandler = require('./handler/message')

const start = (client = new Client()) => {
    console.log('[DEV]', color('Zkyzzz', 'yellow'))
    console.log('[CLIENT] CLIENT Started!')

    // Force it to keep the current session
    client.onStateChanged((state) => {
        console.log('[Client State]', state)
        if (state === 'CONFLICT') client.forceRefocus()
    })

    // listening on message
    client.onMessage((message) => {
        client.getAmountOfLoadedMessages() // Cut message Cache if cache more than 3K
            .then((msg) => {
                if (msg >= 3000) {
                    console.log('[CLIENT]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    client.cutMsgCache()
                }
            })
        // Message Handler
        msgHandler(client, message)
    })

    // listen group invitation
    client.onAddedToGroup(({ groupMetadata: { id }, contact: { name } }) =>
        client.getGroupMembersId(id)
            .then((ids) => {
                console.log('[CLIENT]', color(`Invited to Group. [ ${name} : ${ids.length}]`, 'yellow'))
                // conditions if the group members are less than 2 then the bot will leave the group
                if (ids.length <= 2) {
                    client.sendText(id, 'Maaf, Minimal Membe Grup Adalah 10. Jika Kurang? ByeBye~').then(() => client.leaveGroup(id))
                } else {
                    client.sendText(id, `Halo Member Grup! SIlahkan Ketik *!help* Untuk Melihat Daftar Fitur Bot Ini`)
                }
            }))

    client.onRemovedFromGroup((data) => {
         console.log(data)
    })

    // listen paricipant event on group (wellcome message)
    client.onGlobalParicipantsChanged((event) => {
         if (event.action === 'add') client.sendTextWithMentions(event.chat, `Selamat Datang! Jangan Lupa Baca Deskripsi. @${event.who.replace('@c.us', '')} \n\nMoga Betah, Mau Lihat Menu Fitur Bot? Ketik !help ✨`)
    })

    client.onIncomingCall((callData) => {
         client.contactBlock(callData.peerJid)
    })
}

create('Imperial', options(true, start))
    .then((client) => start(client))
    .catch((err) => new Error(err))