// Concepts array
let concepts = <%- JSON.stringify(concepts) %>;
// ovo sam koristio kada je bio expression expected na liniji iznad 
// https://stackoverflow.com/questions/66827697/writing-ejs-in-a-script-is-giving-me-the-error-expression-expected

// function to filter concepts by category
function filterConcepts(categoryId) {
    let filteredConcepts = concepts.filter(concept => concept.category._id == categoryId);
    // render filtered concepts
    renderConcepts(filteredConcepts);
}

// function to render concepts
function renderConcepts(concepts) {
    let conceptsHTML = "";
    concepts.forEach(function(concept) {
        conceptsHTML += `<a href="/concept/${concept._id}" class="concept-card">
                            <div class="tags-box">
                                <h4 class="heading-tag">${concept.category.title.toUpperCase()}</h4>
                            </div>
                            <div class="title-box">
                                <h2 class="heading-2">${concept.title}</h2>
                            </div>
                            <p class="description">${concept.description}</p>
                        </a>`;
    });
    document.querySelector('.concepts-box').innerHTML = conceptsHTML;
}