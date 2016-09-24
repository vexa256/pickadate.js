let sinon           = require('sinon')

const ACTION        = require('constants/action')
const SCOPE         = require('constants/scope')

let selectedReducer = require('reducers/selected')
let valueUtil       = require('utils/value')



describe('/selectedReducer', () => {


  describe('#[ACTION.TYPE.INITIALIZE]', () => {

    it('initializes the selected date, defaulting to null', () => {
      let state   = undefined
      let payload = {}
      true.should.eql(null == selectedReducer[ACTION.TYPE.INITIALIZE](state, payload))
    })


    it('initializes the selected date with a specific value', () => {
      let state   = new Date(2013, 3, 20)
      let payload = {}
      selectedReducer[ACTION.TYPE.INITIALIZE](state, payload).should.be.exactly(state)
    })


    it('initializes the selected date with a specific epoch timestamp', () => {
      let state   = new Date(2013, 3, 20).getTime()
      let payload = {}
      selectedReducer[ACTION.TYPE.INITIALIZE](state, payload).getTime().should.eql(state)
    })


    it('initializes the selected date with a specific payload value and template', () => {
      let state   = undefined
      let payload = { template: 'yyyy-mm-dd', value: '2014-04-20' }
      selectedReducer[ACTION.TYPE.INITIALIZE](state, payload).should.eql(new Date(2014, 3, 20))
    })

  })



  describe('#[ACTION.TYPE.SELECT]', () => {

    it('sets the selected date', () => {

      let scope    = SCOPE.DAYS
      let selected = null
      let template = 'yyyy-mm-dd'
      let value    = new Date(2013, 3, 20).getTime()

      let state   = new Date(2013, 3, 20)
      let payload = { scope, selected, template, value }

      let createDateToSetSpy = sinon.spy(valueUtil, 'createDateToSet')

      selectedReducer[ACTION.TYPE.SELECT](null, payload).getTime()
        .should.eql(state.getTime())

      createDateToSetSpy.callCount.should.eql(1)
      createDateToSetSpy.lastCall.args.should.eql([selected, {
        scope,
        selected,
        value,
      }])

      createDateToSetSpy.restore()

    })


    it('uses the original state if the value is the same as the selected date', () => {

      let scope    = SCOPE.DAYS
      let selected = new Date(2013, 3, 20)
      let template = 'yyyy-mm-dd'
      let value    = new Date(2013, 3, 20, 4, 20)

      let state   = selected
      let payload = { scope, selected, template, value }

      let createDateToSetSpy = sinon.spy(valueUtil, 'createDateToSet')

      selectedReducer[ACTION.TYPE.SELECT](state, payload).should.be.exactly(state)

      createDateToSetSpy.callCount.should.eql(1)
      createDateToSetSpy.lastCall.args.should.eql([state, {
        scope,
        selected,
        value,
      }])

      createDateToSetSpy.restore()

    })


    it('unsets the selected date', () => {

      let state   = new Date(2013, 3, 20)
      let payload = { value: null }

      let createDateToSetSpy = sinon.spy(valueUtil, 'createDateToSet')

      true.should.eql(null == selectedReducer[ACTION.TYPE.SELECT](state, payload))

      createDateToSetSpy.callCount.should.eql(0)

      createDateToSetSpy.restore()

    })

  })



  describe('#[ACTION.TYPE.SHOW]', () => {

    it('handles all the same scenarios as [ACTION.TYPE.SELECT]', () => {
      selectedReducer[ACTION.TYPE.SHOW].should.be.exactly(selectedReducer[ACTION.TYPE.SELECT])
    })

  })


})