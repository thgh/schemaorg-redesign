import json from '../schema/schema-lookup.json'

export const lookup = json

export const listed = unpack(lookup)

export const ids = listed.map(a => a.id).sort((a, b) => a.localeCompare(b))

export function unpack (map) {
  const list = Object.keys(map).map(key => {
    map[key].id = key
    return map[key]
  })

  list.forEach(item => {
    const fromId = item.id
    item.d2 = item.d2 || []
    item.r2 = item.r2 || []
    item.s2 = item.s2 || []
    item.e2 = item.e2 || []

    toCollection(item.d).forEach(toId => push(map[toId], 'd2', item))
    toCollection(item.r).forEach(toId => push(map[toId], 'r2', item))
    toCollection(item.s).forEach(toId => push(map[toId], 's2', item))
    toCollection(item.e).forEach(toId => push(map[toId], 'e2', item))

    item.d = toCollection(item.d).map(toId => map[toId])
    item.r = toCollection(item.r).map(toId => map[toId])
    item.s = toCollection(item.s).map(toId => map[toId])
    item.e = toCollection(item.e).map(toId => map[toId])
  })

  return list
}

export function toCollection (a) {
  return typeof a === 'string' ? (a ? [a] : null) : a && a.length ? a : []
}

export function push (obj, key, value) {
  if (obj && key) {
    if (obj[key]) {
      obj[key].push(value)
    } else {
      obj[key] = [value]
    }
  }
}
