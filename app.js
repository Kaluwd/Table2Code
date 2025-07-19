        // Global data store
        let tableData = [];
        let currentFormat = '';
        
        // Initialize with sample data if empty
        document.getElementById('input-area').addEventListener('click', function() {
            if (this.textContent.trim() === '') {
                this.textContent = 'id\tname\temail\tjoin_date\n1\tAlice\talice@test.com\t2023-01-15\n2\tBob\tbob@test.com\t2023-02-20\n3\t\tcharlie@test.com\t2023/03/10';
            }
        });
        
        // Detect pasted table data
        document.getElementById('input-area').addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            parseTable(text);
        });
        
        // Parse tabular data into 2D array
        function parseTable(text) {
            const rows = text.trim().split('\n').map(row => {
                return row.split('\t').map(cell => cell.trim());
            });
            tableData = rows;
            document.getElementById('input-area').textContent = text;
            convertTo('smart-sql');
        }
        
        // Conversion logic
        function convertTo(format) {
            if (tableData.length === 0) return;
            
            currentFormat = format;
            let output;
            
            switch(format) {
                case 'sql':
                    output = generateSQL();
                    break;
                case 'smart-sql':
                    output = generateSmartSQL();
                    break;
                case 'typescript':
                    output = generateTypeScript();
                    break;
                case 'json':
                    output = generateJSON();
                    break;
                case 'mock-api':
                    output = generateMockAPI();
                    break;
                case 'markdown':
                    output = generateMarkdown();
                    break;
                case 'csv':
                    output = generateCSV();
                    break;
                default:
                    output = "Unsupported format";
            }
            
            document.getElementById('output-area').textContent = output;
        }
        
        // SQL Generator (basic)
        function generateSQL() {
            const headers = tableData[0];
            let sql = `INSERT INTO ${guessTableName()} (${headers.join(', ')}) VALUES\n`;
            
            for (let i = 1; i < tableData.length; i++) {
                const row = tableData[i].map(cell => `'${cell.replace(/'/g, "''")}'`);
                sql += `  (${row.join(', ')})${i < tableData.length - 1 ? ',' : ';'}\n`;
            }
            
            return sql;
        }
        
        // SQL Generator (smart)
        function generateSmartSQL() {
            const headers = tableData[0];
            const firstRow = tableData[1] || [];
            const tableName = guessTableName();
            
            // Infer column types
            const columns = headers.map((header, i) => {
                const sample = firstRow[i] || '';
                let type = 'VARCHAR(255)';
                if (!isNaN(sample)) type = 'INT';
                if (sample.match(/^\d{4}-\d{2}-\d{2}$/)) type = 'DATE';
                if (sample.match(/^(true|false)$/i)) type = 'BOOLEAN';
                if (header.toLowerCase() === 'id') type += ' PRIMARY KEY';
                return `  ${header} ${type}`;
            });
            
            return `CREATE TABLE ${tableName} (\n${columns.join(',\n')}\n);\n\n` + generateSQL();
        }
        
        // TypeScript Generator
        function generateTypeScript() {
            const headers = tableData[0];
            const firstRow = tableData[1] || [];
            
            const props = headers.map((header, i) => {
                const sample = firstRow[i] || '';
                let type = 'string';
                if (!isNaN(sample)) type = 'number';
                if (sample === 'true' || sample === 'false') type = 'boolean';
                if (sample.match(/^\d{4}-\d{2}-\d{2}$/) || sample.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    type = 'Date | string';
                }
                return `  ${header}: ${type};`;
            });
            
            return `interface ${guessTableName().charAt(0).toUpperCase() + guessTableName().slice(1)} {\n${props.join('\n')}\n}`;
        }
        // In your initialization code:
document.getElementById('input-area').addEventListener('click', function() {
    if (this.textContent.trim() === '' || 
        this.textContent === 'Paste your table here (e.g. from Excel)...') {
        this.textContent = `Paste your table here (e.g. from Excel)...\nid\tname\temail\t\tjoin_date\n1\tmiki\tmiki@dev.com\t2023-01-15\n2\tyishak\tyishak@dev.com\t2023-02-20`;
        this.style.whiteSpace = 'pre';
    }
});
        // JSON Generator
        function generateJSON() {
            const headers = tableData[0];
            const json = [];
            
            for (let i = 1; i < tableData.length; i++) {
                const obj = {};
                headers.forEach((header, j) => {
                    obj[header] = tableData[i][j];
                });
                json.push(obj);
            }
            
            return JSON.stringify(json, null, 2);
        }
        
        // Mock API Generator
        function generateMockAPI() {
            const headers = tableData[0];
            const mockData = tableData.slice(1).map(row => {
                return headers.reduce((obj, header, i) => ({ ...obj, [header]: row[i] }), {});
            });
            return JSON.stringify({ [guessTableName()]: mockData }, null, 2);
        }
        
        // Markdown Generator
        function generateMarkdown() {
            let md = '';
            const headers = tableData[0];
            
            // Header row
            md += `| ${headers.join(' | ')} |\n`;
            
            // Separator
            md += `| ${headers.map(() => '---').join(' | ')} |\n`;
            
            // Data rows
            for (let i = 1; i < tableData.length; i++) {
                md += `| ${tableData[i].join(' | ')} |\n`;
            }
            
            return md;
        }
        
        // CSV Generator
        function generateCSV() {
            return tableData.map(row => row.join(',')).join('\n');
        }
        
        // Download CSV
        function downloadCSV() {
            const csv = generateCSV();
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'table_data.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        
        // Clean dirty data
        function cleanData() {
            tableData = tableData.map(row => 
                row.map(cell => {
                    if (cell === "NULL" || cell === "") return "NULL";
                    if (cell.match(/^\d{2}\/\d{2}\/\d{4}$/)) return cell.split('/').reverse().join('-');
                    return cell.trim();
                })
            );
            refreshTable();
            convertTo(currentFormat);
            alert("Common issues fixed: NULLs, dates, whitespace");
        }
        
        // Analyze data for issues
        function analyzeData() {
            const issues = [];
            const headers = tableData[0] || [];
            
            // Check for duplicate rows
            const uniqueRows = new Set();
            for (let i = 1; i < tableData.length; i++) {
                const rowStr = tableData[i].join('|');
                if (uniqueRows.has(rowStr)) {
                    issues.push({
                        type: 'duplicate',
                        row: i,
                        value: tableData[i].join(', ')
                    });
                }
                uniqueRows.add(rowStr);
            }
            
            // Check for empty cells
            for (let i = 1; i < tableData.length; i++) {
                for (let j = 0; j < tableData[i].length; j++) {
                    if (tableData[i][j] === '') {
                        issues.push({
                            type: 'empty',
                            row: i,
                            column: headers[j],
                            colIndex: j
                        });
                    }
                }
            }
            
            // Check date formats
            const dateColumns = headers.filter(h => h.toLowerCase().includes('date'));
            for (let i = 1; i < tableData.length; i++) {
                dateColumns.forEach((col) => {
                    const colIndex = headers.indexOf(col);
                    const val = tableData[i][colIndex];
                    if (val && !val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        issues.push({
                            type: 'invalid_date',
                            row: i,
                            column: col,
                            colIndex: colIndex,
                            value: val
                        });
                    }
                });
            }
            
            displayIssues(issues);
        }
        
        // Display found issues
        function displayIssues(issues) {
            const issuesList = document.getElementById('issues-list');
            const issuesArea = document.getElementById('issues-area');
            
            if (issues.length === 0) {
                issuesList.innerHTML = '<p>No issues found! Your data looks clean.</p>';
                issuesArea.style.display = 'block';
                return;
            }
            
            issuesList.innerHTML = issues.map(issue => {
                let message = '';
                let actions = '';
                
                switch(issue.type) {
                    case 'duplicate':
                        message = `Row ${issue.row + 1} is a duplicate: ${issue.value}`;
                        actions = `
                            <button class="btn btn-sm btn-danger" onclick="deleteRow(${issue.row})">Delete</button>
                            <button class="btn btn-sm" onclick="showEditableTableHighlight(${issue.row})">Edit</button>
                        `;
                        break;
                    case 'empty':
                        message = `Empty cell at row ${issue.row + 1}, column "${issue.column}"`;
                        actions = `
                            <button class="btn btn-sm" onclick="setCellValue(${issue.row}, ${issue.colIndex}, 'NULL')">Set NULL</button>
                            <button class="btn btn-sm" onclick="showEditableTableHighlight(${issue.row}, ${issue.colIndex})">Edit</button>
                        `;
                        break;
                    case 'invalid_date':
                        message = `Invalid date at row ${issue.row + 1}, column "${issue.column}": ${issue.value}`;
                        actions = `
                            <button class="btn btn-sm" onclick="fixDateFormat(${issue.row}, ${issue.colIndex})">Fix Format</button>
                            <button class="btn btn-sm" onclick="showEditableTableHighlight(${issue.row}, ${issue.colIndex})">Edit</button>
                        `;
                        break;
                }
                
                return `<div class="issue-item">
                    <div>${message}</div>
                    <div class="issue-actions">${actions}</div>
                </div>`;
            }).join('');
            
            issuesArea.style.display = 'block';
        }
        
        // Show editable table with highlight
        function showEditableTableHighlight(rowIndex, colIndex = null) {
            showEditableTable();
            if (rowIndex !== undefined) {
                const rows = document.querySelectorAll('#data-table tr');
                if (rows[rowIndex + 1]) { // +1 for header row
                    rows[rowIndex + 1].style.backgroundColor = 'rgba(245, 158, 11, 0.3)';
                    
                    if (colIndex !== null) {
                        const cells = rows[rowIndex + 1].querySelectorAll('td');
                        if (cells[colIndex]) {
                            cells[colIndex].style.backgroundColor = 'rgba(245, 158, 11, 0.6)';
                        }
                    }
                }
            }
        }
        
        // Show editable table
        function showEditableTable() {
            const table = document.getElementById('data-table');
            table.innerHTML = '';
            
            // Create header row
            const headerRow = document.createElement('tr');
            tableData[0].forEach((header, colIndex) => {
                const th = document.createElement('th');
                th.textContent = header;
                
                // Add column delete button
                if (colIndex > 0) { // Don't allow deleting first column
                    const delBtn = document.createElement('button');
                    delBtn.className = 'btn btn-sm btn-danger';
                    delBtn.textContent = '×';
                    delBtn.style.marginLeft = '5px';
                    delBtn.onclick = () => deleteColumn(colIndex);
                    th.appendChild(delBtn);
                }
                
                headerRow.appendChild(th);
            });
            
            // Add empty cell for row actions
            const actionsTh = document.createElement('th');
            actionsTh.textContent = 'Actions';
            headerRow.appendChild(actionsTh);
            table.appendChild(headerRow);
            
            // Create data rows
            for (let i = 1; i < tableData.length; i++) {
                const row = document.createElement('tr');
                
                tableData[i].forEach((cell, colIndex) => {
                    const td = document.createElement('td');
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'cell-edit';
                    input.value = cell;
                    input.dataset.row = i - 1;
                    input.dataset.col = colIndex;
                    
                    td.appendChild(input);
                    row.appendChild(td);
                });
                
                // Add row delete button
                const actionsTd = document.createElement('td');
                const delBtn = document.createElement('button');
                delBtn.className = 'btn btn-sm btn-danger';
                delBtn.textContent = 'Delete';
                delBtn.onclick = () => {
                    deleteRow(i - 1);
                    showEditableTable(); // Refresh the table view
                };
                actionsTd.appendChild(delBtn);
                row.appendChild(actionsTd);
                
                table.appendChild(row);
            }
            
            document.getElementById('editable-table').style.display = 'block';
            document.getElementById('issues-area').style.display = 'none';
        }
        
        // Hide editable table
        function hideEditableTable() {
            document.getElementById('editable-table').style.display = 'none';
        }
        
        // Hide issues panel
        function hideIssuesPanel() {
            document.getElementById('issues-area').style.display = 'none';
        }
        
        // Save table edits
        function saveTableEdits() {
            const inputs = document.querySelectorAll('#data-table .cell-edit');
            inputs.forEach(input => {
                const row = parseInt(input.dataset.row);
                const col = parseInt(input.dataset.col);
                tableData[row + 1][col] = input.value;
            });
            
            refreshTable();
            convertTo(currentFormat);
            hideEditableTable();
        }
        
        // Add new row
        function addNewRow() {
            const newRow = tableData[0].map(() => '');
            tableData.push(newRow);
            showEditableTable();
        }
        
        // Delete row
        function deleteRow(rowIndex) {
            tableData.splice(rowIndex + 1, 1);
            refreshTable();
            convertTo(currentFormat);
        }
        
        // Delete column
        function deleteColumn(colIndex) {
            if (confirm(`Delete column "${tableData[0][colIndex]}"?`)) {
                tableData.forEach(row => row.splice(colIndex, 1));
                refreshTable();
                convertTo(currentFormat);
                showEditableTable(); // Refresh the table view
            }
        }
        
        // Set cell value
        function setCellValue(rowIndex, colIndex, value) {
            tableData[rowIndex + 1][colIndex] = value;
            refreshTable();
            convertTo(currentFormat);
            hideIssuesPanel();
        }
        
        // Fix date format
        function fixDateFormat(rowIndex, colIndex) {
            const value = tableData[rowIndex + 1][colIndex];
            if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                tableData[rowIndex + 1][colIndex] = value.split('/').reverse().join('-');
            }
            refreshTable();
            convertTo(currentFormat);
            hideIssuesPanel();
        }
        
        // Shareable link
        function generateShareLink() {
            const dataStr = JSON.stringify(tableData);
            const encoded = btoa(encodeURIComponent(dataStr));
            const link = `${window.location.href.split('#')[0]}#data=${encoded}`;
            
            navigator.clipboard.writeText(link).then(() => {
                alert("Shareable link copied to clipboard!\n\n" + link);
            });
        }
        
        // Load shared data
        function loadSharedData() {
            if (window.location.hash.includes('data=')) {
                const encoded = window.location.hash.split('data=')[1];
                const decoded = decodeURIComponent(atob(encoded));
                parseTable(JSON.parse(decoded));
            }
        }
        
        // Copy to clipboard
        function copyToClipboard() {
            const output = document.getElementById('output-area').textContent;
            navigator.clipboard.writeText(output).then(() => {
                alert("Copied to clipboard!");
            });
        }
        
        // Dark mode toggle
        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        }
        
        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
        
        // Refresh table display
        function refreshTable() {
            document.getElementById('input-area').textContent = 
                tableData.map(row => row.join('\t')).join('\n');
        }
        
        // Guess table name
        function guessTableName() {
            const headers = tableData[0] || [];
            if (headers.some(h => h.toLowerCase().includes('email'))) return 'users';
            if (headers.some(h => h.toLowerCase().includes('order'))) return 'orders';
            return 'table_name';
        }
        
        // About modal
        function showAbout() {
            document.getElementById('modal-title').textContent = 'About Table2Code';
            document.getElementById('modal-content').innerHTML = `
                <p>Table2Code is a free web tool that helps developers convert tabular data between various formats.</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>Convert Excel/CSV to SQL, TypeScript, JSON, Markdown</li>
                    <li>Smart data type detection</li>
                    <li>Data cleaning tools</li>
                    <li>100% client-side - your data never leaves your browser</li>
                </ul>
                <p>No registration required - use it anytime for free!</p>
            `;
            document.getElementById('info-modal').style.display = 'flex';
        }
        
        // Privacy modal
        function showPrivacy() {
            document.getElementById('modal-title').textContent = 'Privacy Policy';
            document.getElementById('modal-content').innerHTML = `
                <p>Table2Code respects your privacy:</p>
                <ul>
                    <li>All processing happens in your browser</li>
                    <li>We don't store your data on any servers</li>
                    <li>Share links are encoded in the URL (optional)</li>
                    <li>No cookies or tracking</li>
                </ul>
            `;
            document.getElementById('info-modal').style.display = 'flex';
        }
        
        // Terms modal
        function showTerms() {
            document.getElementById('modal-title').textContent = 'Terms of Use';
            document.getElementById('modal-content').innerHTML = `
                <p>By using Table2Code, you agree to:</p>
                <ul>
                    <li>Use this tool for lawful purposes only</li>
                    <li>Not use it to process sensitive personal data</li>
                    <li>Accept that this is provided "as-is" without warranties</li>
                </ul>
                <p>The developer is not liable for any data loss or misuse.</p>
            `;
            document.getElementById('info-modal').style.display = 'flex';
        }
        
        // Set developer link (replace with your actual link)
        document.getElementById('developer-link').href = "https://vercel.com/kalus-projects-806c524a/aps";
        
        // Initialize
        loadSharedData();
