
lyvo.getDetailLinks = async function (search) {
    await lyvo.waitForElementPresent(document.body, 'main h2 a', 5000)
    let search_list = document.querySelectorAll('main h2 a')
    if (search_list.length === 0) {
        search_list = document.querySelectorAll('h2 a')
    }
    let links = []
    for (let i = 0; i < search_list.length; i++) {
        let title = lyvo.cleanText(search_list[i])
        let url = search_list[i].getAttribute('href')
        links.push({ title, url })
    }
    return {
        links: links
    }
}

lyvo.getContent = async function (search) {
    await lyvo.waitLoaded()
    return {
        title: document.title,
        content: lyvo.extractHtmlContent()
    }
}
