class Counter {
    constructor(private count: number){}

    increment(){
        return this.count++
    }
    getCount(){
        return this.count
    }
}

function counterTest1(): boolean {
    return new Counter(0).getCount() == 0
}
function counterTest2(): boolean {
    return new Counter(0).increment() == 0
}
function counterTest3(): boolean {
    var counter = new Counter(0)
    counter.increment()
    return counter.getCount() == 1
}
function counterTest() {
    console.log("counterTest1:", counterTest1())
    console.log("counterTest2:", counterTest2())
    console.log("counterTest3:", counterTest3())
}

export { Counter }