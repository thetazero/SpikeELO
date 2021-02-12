const url = "https://docs.google.com/spreadsheets/d/1wEtNxQyLzdBLiHQIDc0YDATR9Zc7y8FZ4gy3v-MrSqE/export?format=csv"
const matchCount = 20;

let ELO = {

}

let Games = {

}

let Matches = []

let names = {
  A: "Axel",
  L: "Lesha",
  I: "August",
  N: "Neel",
  S: "Simon",
  G: "Guarov"
}

let getID = {

}

const State = {
  _q: "*",
  get q() { return this._q },
  set q(val) {
    this._q = val
    if (qElem.innerText.toLowerCase() != val.toLowerCase()) qElem.innerText = val
    filterTeams()
    this._qWatch.forEach(e => { e(val) })
  },
  _qWatch: [],
  qWatch(fn) {
    this._qWatch.push(fn)
  },
  _tab: "Rating",
  get tab() { return this._tab },
  set tab(val) {
    this._tab = val
    Array.from(navElem.children).forEach(e => {
      console.log(e)
      if (e.getAttribute("tab").toLowerCase() == val.toLowerCase()) {
        e.classList.add("on")
      } else {
        e.classList.remove("on")
      }
    })
    Array.from(containerElem.children).forEach(e => {
      e.style.display = e.getAttribute("tab").toLowerCase() == val.toLowerCase() ? "block" : "none"
    })
    if (this.tabFn[val]) this.tabFn[val]()
  },
  tabFn: {
    Matches() {
      matchesElem.innerHTML = ""
      for (let i = 0; i < State.shownMatches.length; i++) {
        let m = State.shownMatches[i]
        let c1 = `<td>${formatID(m[0])} (${m[2]}<span class="green"> +${m[4]}</span>)</td>`
        let c2 = `<td>${formatID(m[1])} (${m[3]}<span class="red"> -${m[4]}</span>)</td>`
        if (State.q != "*" && State.q != '' && !makeQuery(State.q).test(plainTextID(m[0])) && makeQuery(State.q).test(plainTextID(m[1]))) {
          [c1, c2] = [c2, c1]
        }
        matchesElem.innerHTML += `<tr>${c1}${c2}</tr>`
      }
    },
    Team() {
      State.teamSelected = getID[State.q.toLowerCase()] ?? null
      console.log(getID[State.q])
    }
  },
  _shownMatches: [],
  get shownMatches() { return this._shownMatches },
  set shownMatches(val) {
    this._shownMatches = val
    if (this.tab == "Matches") this.tabFn[this.tab]()
  },
  _avg: 1000,
  get avg() {
    return _avg
  },
  set avg(val) {
    this._avg = val
    document.querySelector("#averageELO").innerText = isNaN(val) ? "????" : Math.round(val)
  },
  _teamSelected: false,
  get teamSelected() {
    return this._teamSelected
  },
  set teamSelected(id) {
    this._teamSelected = id
    document.querySelector("#teamSelected").style.display = id ? "none" : "block"
    let e = document.querySelector("#teamCard")
    e.style.display = id ? "block" : "none"
    if (id != null) {
      let [wins, losses] = [0, 0]
      Matches.forEach(([winner, looser]) => {
        if (winner == id) {
          wins++
        } else if (looser == id) {
          losses++
        }
      })
      e.querySelector('.title').innerText = `${plainTextID(id)} (${ELO[id]})`
      e.querySelector('.games').innerHTML = `${Games[id]}`
      e.querySelector('.wins').innerHTML = `${wins}`
      e.querySelector('.losses').innerHTML = `${losses}`
    }
  }
}

State.qWatch((q) => {
  State.teamSelected = getID[State.q.toLowerCase()] ?? null
})

function formatName(n) {
  return names[n] ?? n
}

function formatID(id) {
  let p1 = formatName(id[0])
  let p2 = formatName(id[1])
  return `<a href=#${p1}>${p1}</a> <a href="#${p1} & ${p2}">&</a> <a href=#${p2}>${p2}</a>`
}

function makeQuery(q) {
  let query;
  if (q == "*") {
    query = {
      test() {
        return true;
      }
    }
  } else {
    query = new RegExp(`${State.q}`, "i")
  }
  return query
}

function plainTextID(id) {
  let text = `${formatName(id[0])} & ${formatName(id[1])}`
  getID[text.toLowerCase()] = id
  return text
}

function calcK(team) {
  if (Games[team]) return 32 + 64 / Games[team]//dumb function
  return 32 * 3
}

function updateElo(w, l) {
  // let k = Math.min(calcK(w), calcK(l))//magic chess number
  let k = 48
  console.log(k)

  let rw = 10 ** (ELO[w] / 400)
  let rl = 10 ** (ELO[l] / 400)
  let ew = rw / (rw + rl)
  let Δ = Math.round(ELO[w] + k * (1 - ew) - ELO[w])
  ELO[w] += Δ
  ELO[l] -= Δ
  Games[w] = Games[w] ? Games[w] + 1 : 1
  Games[l] = Games[l] ? Games[l] + 1 : 1
  return Δ
}

function filterTeams() {
  let query = makeQuery(State.q)
  let count = 0;
  let avg = 0
  for (let i = 0; i < ratingElem.children.length; i++) {
    let row = ratingElem.children[i]
    let name = ratingElem.children[i].children[0].innerText
    let match = query.test(name)
    row.style.display = match ? "" : "none"
    if (match) {
      avg += parseInt(ratingElem.children[i].children[1].innerText)
      row.style.background = count % 2 == 0 ? "var(--background)" : "var(--background_darker)"
      count++
    }
  }
  avg /= count
  State.avg = avg
  let newShownMatches = []
  for (let i = Matches.length - 1; i >= 0; i--) {
    let team1 = plainTextID(Matches[i][0])
    let team2 = plainTextID(Matches[i][1])
    if (query.test(team1) || query.test(team2)) {
      newShownMatches.push(Matches[i])
    }
    if (newShownMatches.length == matchCount) break;
  }
  State.shownMatches = newShownMatches
}

let startELO = 1000
async function load() {
  Matches = await CSV.fetch({ url })
  Matches = Matches.records
  for (let i = 0; i < Matches.length; i++) {
    let match = Matches[i]
    if (ELO[match[0]] == undefined) {
      ELO[match[0]] = startELO
    }
    if (ELO[match[1]] == undefined) {
      ELO[match[1]] = startELO
    }
    match.push(ELO[match[0]])
    match.push(ELO[match[1]])
    let Δ = updateElo(match[0], match[1])
    match.push(Δ)
  }
  let ELOArr = []
  for (const id in ELO) {
    ELOArr.push({
      id,
      elo: ELO[id]
    })
  }
  ELOArr.sort((a, b) => {
    return b.elo - a.elo
  })
  for (let i = 0; i < ELOArr.length; i++) {
    let { elo, id } = ELOArr[i]
    ratingElem.innerHTML += `<tr>
  <td>${formatID(id)}</td>
  <td>${elo}</td>
</tr>`
  }
  State.shownMatches = Matches.slice(Math.max(Matches.length - matchCount, 0)).reverse()
  filterTeams()
  console.log(Matches)
}

load()

let qElem;
let ratingElem;
let matchesElem;
let navElem;
let containerElem;
window.onload = () => {
  ratingElem = document.querySelector("#ratingElem")
  matchesElem = document.querySelector("#matchesElem")
  qElem = document.querySelector("#q")
  navElem = document.querySelector("nav ul")
  containerElem = document.querySelector(".tab_container")
  qElem.addEventListener("keyup", () => {
    State.q = qElem.innerText
  })
  qElem.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      e.preventDefault()
      qElem.blur()
      window.location.hash = State.q.toLowerCase()
    }
  })
  qElem.addEventListener("blur", () => {
    if (qElem.innerText == '') qElem.innerText = "*"
    State.q = qElem.innerText
  })
  Array.from(navElem.children).forEach(e => {
    if (e.getAttribute("tab") != "None") {
      console.log(e.innerText, e.getAttribute("tab"))
      e.addEventListener('click', () => {
        State.tab = e.getAttribute('tab')
      })
    }
  })

  State.q = decodeURI(window.location.hash.slice(1))
  if (State.q == '') State.q = '*'
}

window.onhashchange = () => {
  State.q = decodeURI(window.location.hash.slice(1))
}

function clearQuery() {
  State.q = "*"
  window.location.hash = State.q.toLowerCase()
}