const fs = require('fs')

if (exists('schema-lookup.json')) {
  console.log('schema-lookup.json already exists')
} else if (exists('schema-3.3.jsonld')) {
  compile(read('schema-3.3.jsonld'))
} else {
  console.log('Downloading schema-3.3.jsonld')
  require('node-fetch')('https://raw.githubusercontent.com/schemaorg/schemaorg/master/data/releases/3.3/schema.jsonld')
    .then(res => res.json())
    .then(compile)
}

function compile (data, haveIt) {
  if (!process.env.NOW && !haveIt) {
    write('schema-3.3.jsonld', data)
  }

  const lookup = {}

  data['@graph'].sort((a, b) => a['@id'].localeCompare(b['@id']))

  data['@graph'].forEach(item => {
    if (!item['@id'].startsWith('http://schema.org/')) {
      return // console.log(item['@id'])
    }
    lookup[item['@id'].slice(18)] = {
      d: fromIdCollection(item['http://schema.org/domainIncludes']),
      r: fromIdCollection(item['http://schema.org/rangeIncludes']),
      e: fromIdCollection(item['http://schema.org/supersededBy']),
      s: fromIdCollection(item['rdfs:subClassOf']),
      c: relativeLinks(item['rdfs:comment']),
      l: item['rdfs:label'] === item['@id'] ? item['rdfs:label'] : undefined
    }
  })

  write('schema-lookup.json', lookup)
}


function fromType (t) {
  return t === 'rdf:Property' ? 1 : t === 'rdf:Class' ? 2 : t
}

function fromId (i) {
  return i.startsWith('http://schema.org/') ? i.slice(18) : i
}

function fromIdCollection (i) {
  if (Array.isArray(i)) {
    return i.map(fromIdCollection)
  }
  if (typeof i === 'object' && i['@id']) {
    return fromId(i['@id'])
  }
  return i
}

function relativeLinks (str) {
  return str
    .replace(/"http:\/\/schema\.org\//g, '"/')
    .replace(/ class="localLink"/g, '')
}

function exists (path) {
  return fs.existsSync(__dirname + '/' + path)
}

function read (path) {
  try {
    const data = fs.readFileSync(__dirname + '/' + path, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    console.log(e.message)
  }
}

function write (path, str) {
  // str = JSON.stringify(str, null, 2)
  str = JSON.stringify(str)
  console.log(path, str.length)

  try {
    return fs.writeFileSync(__dirname + '/' + path, str, 'utf8')
  } catch (e) {
    console.log(e.message)
  }
}
