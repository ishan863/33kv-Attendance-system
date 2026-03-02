const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { format } = require('date-fns')

admin.initializeApp()
const db = admin.firestore()

/**
 * Daily Auto-OFF Function
 * Runs every day at 8:00 PM IST (14:30 UTC)
 * Marks employees as OFF if no attendance submitted today
 */
exports.autoMarkOff = functions.pubsub
  .schedule('30 14 * * *')   // 8:00 PM IST = 14:30 UTC
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    console.log(`Auto-OFF job running for date: ${today}`)

    // Get all active employees
    const empSnap = await db.collection('employees')
      .where('status', '==', 'active')
      .get()

    if (empSnap.empty) {
      console.log('No active employees found.')
      return null
    }

    // Get all attendance records for today
    const attSnap = await db.collection('attendance')
      .where('date', '==', today)
      .get()

    const markedEmployeeIds = new Set()
    attSnap.forEach(doc => markedEmployeeIds.add(doc.data().employeeId))

    // Batch write OFF records for unmarked employees
    const batch = db.batch()
    let count = 0

    empSnap.forEach(empDoc => {
      const emp = empDoc.data()
      if (!markedEmployeeIds.has(empDoc.id)) {
        const attRef = db.collection('attendance').doc()
        batch.set(attRef, {
          employeeId: empDoc.id,
          employeeName: emp.name,
          team: emp.team || '',
          date: today,
          status: 'Off',
          photoUrl: null,
          time: '20:00',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          markedBy: 'system_auto',
        })
        count++
      }
    })

    if (count > 0) {
      await batch.commit()
      console.log(`Auto-OFF applied to ${count} employees.`)
    } else {
      console.log('All employees already marked.')
    }

    return null
  })

/**
 * HTTP trigger for manual auto-OFF (Admin use)
 */
exports.triggerAutoOffManual = functions.https.onCall(async (data, context) => {
  // Check admin role (optional auth check)
  const today = data.date || format(new Date(), 'yyyy-MM-dd')

  const empSnap = await db.collection('employees').where('status','==','active').get()
  const attSnap = await db.collection('attendance').where('date','==',today).get()

  const markedIds = new Set()
  attSnap.forEach(d => markedIds.add(d.data().employeeId))

  const batch = db.batch()
  let count = 0

  empSnap.forEach(empDoc => {
    if (!markedIds.has(empDoc.id)) {
      const ref = db.collection('attendance').doc()
      batch.set(ref, {
        employeeId: empDoc.id,
        employeeName: empDoc.data().name,
        team: empDoc.data().team || '',
        date: today,
        status: 'Off',
        photoUrl: null,
        time: '20:00',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        markedBy: 'admin_manual',
      })
      count++
    }
  })

  if (count > 0) await batch.commit()
  return { success: true, count, date: today }
})
