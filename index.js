const request = require('superagent')
const H = require('highland')

/*
Попробуем доказатать на примере тезис: использование функционального стиля программирования позволяет писать более чистый и легкий в сопровождение код.
Задача:
Есть некий сервис c REST API и endpointом /people. При POST-запросе на этот endpoint'a создается новая сушность. Написать функцию которая принимает массив объектов вида { name: 'Max' } и создают набор сущностей посредством API(по-английски, это называется batch-операция).
Попробуем решить эту задачу в лоб:
*/

function batchCreate(bodies) {
  const calls = []
  for (body of bodies) {
    calls.push(
      request
        .post('/people')
        .send(body)
    )
  }
  return Promise.all(calls)
}

/*
Теперь попробуем решить туже задачу используя функциональный стиль:
*/

function batchCreate(bodies) {
  const calls = payloads.map(body =>
    request
      .post('/people')
      .send(body)
      .then(r = r.status)
  )
  return Promise.all(calls)
}

/*
По большему счету, два этих куска кода абсолютно идентичны и прекрасно справляются с поставленной задачей. Правда есть один нюанс, редко так бывает чтобы поставленная задача не изменялась в ходе разработки. Давайте чуть изменним требованния:
У сервиса который появилось ограниченние на количество запросов в промежуток времени: за секунду один клиент может выпонить не более пяти запросов. Выполнее большего количества запросов приведет к тому что сервис будет возвращать 429 HTTP ошибку(too many requests). Нам нужно изменить нашу функцию так чтобы она соостветсвовала новым требованиям.
В этом месте, пожалуй стоит, остановитьс и подумать как бы решали поставленную задачу.

Возьмем за основу наш функциольный код и попробуем его изменить. Основная проблема "чистого" функциольного программирования состоит в том, что оно ничего "не знает" - о среде выполнения и вводе-выводе(в английском для этого есть выражение side effects), но на практике мы постоянно работаем с IO. Чтобы заполнить этот пробел на помошь приходит Reactive Programming - набор подходов пытающихся решить проблему с side effects. Самой известной реализацией этой парадигмы является библиотека Rx. Которая всем хороша, кроме того что у нее очень высокий порог вхождения(это мое субъективное мнение). Она позволяет реализовать концепцию reactive streams.
Целью этой статьи является поиск легких путей, по-этому, мы возьмем библиотеку Highland, которая старается решить ту же задачу что и Rx но намного проще в освоении.
Hачнем с простого - сделаем наш код "реактивным" без добавления нового функционала
*/

function batchCreate(bodies) {
  const calls = H(bodies)
    .flatMap(body =>
      H(request
        .post('localhost:3000/people')
        .send(body)
        .then(r => r.status)
      )
    )
    .collect()
    .toPromise(Promise)
  return calls
}

/* Обратите внимание на .flatMap и callback который он принимает. Идея довольна проста - мы заворачиваем Promise в конструктор потока чтобы получить поток с одним значением(или ошибкой. важно понимать что это именно значение, а не промис).
 * .collect нам нужен для того чтобы собрать все значения в одной "точке" в массив.
 * В результате это нам дает потоk потоков - при помоши flatMap мы сглаживаем это в один поток значений которым мы можем оперировать(кто сказал монада?).
 * Теперь давайте попробуем реализовать наше требование:
*/

function batchCreate(bodies) {
  const calls = H(bodies)
    .flatMap(body =>
      H(request
        .post('localhost:3000/people')
        .send(body)
        .then(r => r.status)
      )
    )
    .ratelimit(5, 1000)
    .collect()
    .toPromise(Promise)
  return calls
}

/* Done - как мы видим при использовании даhного подхода наше требовния реализуеться очень декларативно и одной строчкой
*/
//https://www.g9labs.com/2016/03/21/lossless-rate-limiting-with-rxjs/
