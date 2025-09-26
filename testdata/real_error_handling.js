function riskyOperation() {
  let resource = 'critical_resource'
  
  defer {
    console.log('cleaning up:', resource)
  }
  
  console.log('start operation')
  
  try {
    console.log('attempting risky task')
    throw('something went wrong')
  } catch (e) {
    console.log('caught error:', e)
  }
  
  console.log('operation completed')
}

riskyOperation()