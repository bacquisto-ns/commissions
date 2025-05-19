// Direct data retrieval function for commissions
app.get('/api/raw-commissions', async (req, res) => {
  try {
    // Use the raw pool connection to query directly
    const { rows } = await pool.query(`
      SELECT 
        c.id, c.amount, c.status, c.broker_id, 
        t.transaction_date, t.transaction_type, t.participant_count,
        bp.program_name, bp.program_type,
        o.name as employer_name
      FROM commissions c
      JOIN transactions t ON c.transaction_id = t.id
      JOIN benefit_programs bp ON t.benefit_program_id = bp.id 
      JOIN organizations o ON bp.organization_id = o.id
      ORDER BY t.transaction_date DESC
      LIMIT 50;
    `);
    
    return res.json({ data: rows, meta: { total: rows.length, limit: 50, offset: 0 } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }
});
