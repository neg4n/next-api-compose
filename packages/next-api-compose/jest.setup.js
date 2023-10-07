global.Response = class MockedResponse {
  constructor(body, status) {
    this.body = body
    this.status = status
  }
}
