const API_KEY = `603ffb3cdc6de718ce924a39dcdeaab44f6f4a5cbc10378d31aa6e963ebb940c`;

const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)
const AGGREGATE_INDEX = "5";

socket.addEventListener("message", e => {
    const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice} = JSON.parse(
        e.data
    );
    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return;
    }
    const handlers =  tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(newPrice))
    
})


// const loadTicker = () => {
//     if (tickersHandlers.size === 0) {
//         return
//     }
    
//     fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()]
//     .join(
//     ","
//     )}&tsyms=USD&api_key=${API_KEY}`
//     )
//     .then(r => r.json())
//     .then(rawData => { 
//     const updatedPrices = Object.fromEntries(
//         Object.entries(rawData).map(([key, value]) => [key, value.USD])
//         )

//         Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
//             const handlers =  tickersHandlers.get(currency) ?? [];
//             handlers.forEach(fn => fn(newPrice))
//         })
//     });
// };

function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message);
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage); 
        return;
    }
    socket.addEventListener('open', () => {
        socket.send(stringifiedMessage);
    }, {onse: true})
}

function subscribeToTickerOnWs(ticker) {
    sendToWebSocket({
        "action": "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

function unsubscribeFromTickerOnWs(ticker) {
    sendToWebSocket({
        "action": "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

export const subscribeToTicker = (ticker, cb) => {
    const Subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...Subscribers, cb]);
    subscribeToTickerOnWs(ticker)
}

export const unsubscribeFromTicker = ticker => {
    tickersHandlers.delete(ticker)
    unsubscribeFromTickerOnWs(ticker)
    // const Subscribers = tickersHandlers.get(ticker) || [];
    // tickersHandlers.set(ticker, Subscribers.filter(fn => fn /= cb))
}

// setInterval(loadTicker, 5000)