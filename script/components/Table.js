
class Table {
    constructor(config) {
        this.config = config;
        this.data = [];
        this.container = null;
        this.currentPage = 1;
        this.itemsPerPage = config.itemsPerPage || 10;
    }

    setData(data) {
        this.data = data;
        this.render();
    }

    createHeader() {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');

        this.config.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            if (column.width) {
                th.style.width = column.width;
            }
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        return thead;
    }

    createRow(item) {
        const tr = document.createElement('tr');

        this.config.columns.forEach(column => {
            const td = document.createElement('td');
            
            if (column.type === 'actions') {
                td.appendChild(this.createActions(item));
            } else if (column.type === 'status') {
                td.appendChild(this.createStatusBadge(item[column.field]));
            } else if (column.formatter) {
                td.innerHTML = column.formatter(item[column.field], item);
            } else {
                td.textContent = item[column.field];
            }

            tr.appendChild(td);
        });

        return tr;
    }

    createStatusBadge(status) {
        const badge = document.createElement('span');
        badge.className = 'status-badge';
        
        if (status > 20) {
            badge.className += ' in-stock';
            badge.textContent = 'En Stock';
        } else if (status > 0) {
            badge.className += ' low-stock';
            badge.textContent = 'Stock Bajo';
        } else {
            badge.className += ' out-of-stock';
            badge.textContent = 'Sin Stock';
        }

        return badge;
    }

    createActions(item) {
        const container = document.createElement('div');
        container.className = 'action-buttons';

        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary btn-sm';
        editButton.textContent = 'Editar';
        editButton.onclick = () => this.config.onEdit(item);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger btn-sm';
        deleteButton.textContent = 'Eliminar';
        deleteButton.onclick = () => this.config.onDelete(item);

        container.appendChild(editButton);
        container.appendChild(deleteButton);

        return container;
    }

    createPagination() {
        const totalPages = Math.ceil(this.data.length / this.itemsPerPage);
        const container = document.createElement('div');
        container.className = 'pagination';

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.className = 'btn btn-secondary';
        prevButton.disabled = this.currentPage === 1;
        prevButton.onclick = () => this.changePage(this.currentPage - 1);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.className = 'btn btn-secondary';
        nextButton.disabled = this.currentPage === totalPages;
        nextButton.onclick = () => this.changePage(this.currentPage + 1);

        container.appendChild(prevButton);
        container.appendChild(nextButton);

        return container;
    }

    changePage(page) {
        this.currentPage = page;
        this.render();
    }

    render() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'products-table-container';
        }

        this.container.innerHTML = '';

        const table = document.createElement('table');
        table.className = 'products-table';

        table.appendChild(this.createHeader());

        const tbody = document.createElement('tbody');
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedData = this.data.slice(start, end);

        paginatedData.forEach(item => {
            tbody.appendChild(this.createRow(item));
        });

        table.appendChild(tbody);
        this.container.appendChild(table);

        if (this.data.length > this.itemsPerPage) {
            this.container.appendChild(this.createPagination());
        }

        return this.container;
    }
}

export default Table;