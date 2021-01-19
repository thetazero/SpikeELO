const url = "https://docs.google.com/spreadsheets/d/1wEtNxQyLzdBLiHQIDc0YDATR9Zc7y8FZ4gy3v-MrSqE/export?format=csv"

let ELO = {

}

let names = {
  A: "Axel",
  L: "Lesha",
  I: "August",
  N: "Neel",
  S: "Simon",
}

const State = {
  _q: "*",
  get q() { return this._q },
  set q(val) {
    this._q = val
    if (qElem.innerText.toLowerCase() != val.toLowerCase()) qElem.innerText = val
    window.location.hash = val.toLowerCase()
    filterTeams()
  }
}

function formatID(id) {
  let p1 = names[id[0]] ?? id[0]
  let p2 = names[id[1]] ?? id[1]
  return `<a href=#${p1}>${p1}</a> & <a href=#${p2}>${p2}</a>`
}

function updateElo(w, l) {
  let k = 32//magic chess number

  let rw = 10 ** (ELO[w] / 400)
  let rl = 10 ** (ELO[l] / 400)
  let ew = rw / (rw + rl)
  let Δ = Math.round(ELO[w] + k * (1 - ew) - ELO[w])
  ELO[w] += Δ
  ELO[l] -= Δ
}

function filterTeams() {
  let query;
  if (State.q == "*") {
    query = {
      test() {
        return true;
      }
    }
  } else {
    query = new RegExp(`${State.q}`, "i")
  }
  let count = 0;
  for (let i = 0; i < table.children.length; i++) {
    let row = table.children[i]
    let name = table.children[i].children[0].innerText
    let match = query.test(name)
    row.style.display = match ? "" : "none"
    if (match) {
      row.style.background = count % 2 == 0 ? "var(--background)" : "var(--background_darker)"
      count++
    }
  }
}

let startELO = 1000
async function load() {
  let data = await CSV.fetch({ url })
  for (let i = 0; i < data.records.length; i++) {
    let match = data.records[i]
    if (ELO[match[0]] == undefined) {
      ELO[match[0]] = startELO
    }
    if (ELO[match[1]] == undefined) {
      ELO[match[1]] = startELO
    }
    updateElo(match[0], match[1])
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
    table.innerHTML += `<tr>
  <td>${formatID(id)}</td>
  <td>${elo}</td>
</tr>`
  }
  filterTeams()
  console.log(data)
}

load()

let qElem;
let table;
window.onload = () => {
  table = document.querySelector("#table")
  qElem = document.querySelector("#q")
  qElem.addEventListener("keyup", () => {
    State.q = qElem.innerText
  })
  qElem.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      e.preventDefault()
      qElem.blur()
    }
  })
  qElem.addEventListener("blur", () => {
    if (qElem.innerText == '') qElem.innerText = "*"
    State.q = qElem.innerText
  })
  State.q = decodeURI(window.location.hash.slice(1))
  if (State.q == '') State.q = '*'
}

window.onhashchange = () => {
  State.q = decodeURI(window.location.hash.slice(1))
}