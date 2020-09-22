const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
    static async build(){
        const browser = await puppeteer.launch({
          //  executablePath: '/usr/bin/google-chrome',
            headless: true,
          //  args: ['--no-sandbox', '--disable-setuid-sandbox']
            args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        const customPage =  new CustomPage(page);
        return new Proxy(customPage,{
            get: function(target, property){
                return customPage[property] || browser[property] || page[property];
            }
        })
    }

    constructor(page){
        this.page = page
    }

    async login(){
        const user =  await userFactory();
        const { session, sig } = await sessionFactory(user);
        await this.page.setCookie({ 'url': 'http://localhost:3000', name: 'session', value: session });
        await this.page.setCookie({ 'url': 'http://localhost:3000', name: 'session.sig', value: sig });
        await this.page.goto('http://localhost:3000/blogs');
        await this.page.waitFor('a[href="/auth/logout"]');    
    }

    async getContentsOf(selector){
        return this.page.$eval(selector, el => el.innerHTML);
    }

    
    get(path){
        return this.page.evaluate(
            async (_path)=>{
                return fetch(_path, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type':'application/json'
                    }
                }).then(res=> res.json());

            }
        , path)
    }

    post(path, data){
        return this.page.evaluate(
            async (_path, _data)=>{

                return await fetch(_path, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type':'application/json'
                    },
                    body: JSON.stringify(_data)
                }).then(res=> res.json());

            }
        , path, data)
    }


    execRequest(actions){
        return Promise.all(actions.map(({method, path, data}) =>{
            return this[method](path, data);
        }));
    }
}

module.exports = CustomPage;