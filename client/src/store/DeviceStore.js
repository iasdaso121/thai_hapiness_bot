import {makeAutoObservable} from "mobx"

export default class DeviceStore {
    constructor() {
        this._types = [
            // {id:1, name:"phones"},
            // {id:2, name:"fridges"},
            // {id:3, name:"boilers"},
            // {id:4, name:"radio"},
        ]
        this._brands = [
            // {id:1, name:"samsung"},
            // {id:2, name:"hp"},
        ]
        this._devices = [
            // {id:1, name:"phone 1", price:"10000", rating:5, img: 'src/assets/dia.png'},
            // {id:2, name:"phone 2", price:10000, rating:5, img: 'client/src/assets/dia.png'},
            // {id:3, name:"phone 3", price:10000, rating:5, img: 'client/src/assets/dia.png'},
            // {id:4, name:"phone 4", price:10000, rating:5, img: 'client/src/assets/dia.png'},
            // {id:5, name:"phone 5", price:10000, rating:5, img: 'client/src/assets/dia.png'},
            // {id:6, name:"phone 6", price:10000, rating:5, img: 'client/src/assets/dia.png'},
            // {id:7, name:"phone 7", price:10000, rating:5, img: 'client/src/assets/dia.png'},
        ]
        this._selectedType = {}
        this._selectedBrand = {}
        this._page = 1
        this._totalCount = 0
        this._limit = 3

        makeAutoObservable(this)
    }

    setTypes(types) {
        this._types = types
    }
    setBrands(brands) {
        this._brands = brands
    }
    setDevices(devices) {
        this._devices = devices
    }

    setSelectedType(type) {
        this.setPage(1)
        // this._selectedBrand = {}
        this._selectedType = type
    }
    setSelectedBrand(brand) {
        this.setPage(1)
        // this._selectedType = {}
        this._selectedBrand = brand
    }

    setPage(page) {
        this._page = page
    }
    setTotalCount(count) {
        this._totalCount = count
    }
    // setLimit(limit) {
    //     this._limit = limit
    // }

    get types() {
        return this._types
    }
    get brands() {
        return this._brands
    }
    get devices() {
        return this._devices
    }

    get selectedType() {
        return this._selectedType
    }
    get selectedBrand() {
        return this._selectedBrand
    }

    get page() {
        return this._page
    }
    get totalCount() {
        return this._totalCount
    }
    get limit() {
        return this._limit
    }
}