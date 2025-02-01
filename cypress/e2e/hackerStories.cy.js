describe('Hacker Stories', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'
  context('Hitting the real API', () => {
    beforeEach(() => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '0'
        }
      }).as('getStories')
      cy.visit('/')
      cy.wait('@getStories')
    })

    it('shows 20 stories, then the next 20 after clicking "More"', () => {
      cy.get('.item').should('have.length', 20)
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '1'
        }
      }).as('getNextStories')
      cy.get('.item').should('have.length', 20)

      cy.contains('More').should('be.visible').click()

      cy.wait('@getNextStories')

      cy.get('.item').should('have.length', 40)
    })
    it('searches via the last searched term', () => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: newTerm,
          page: '0'
        }
      }).as('getNewTermStories')
      cy.get('#search').should('be.visible').clear().type(`${newTerm}{enter}`)

      cy.wait('@getNewTermStories')
      cy.getLocalStorage('search').should('be.equal', newTerm)

      cy.get(`button:contains(${initialTerm})`).should('be.visible').click()
      cy.wait('@getStories')
      cy.getLocalStorage('search').should('be.equal', initialTerm)

      cy.get('.item').should('have.length', 20)
      cy.get('.item').first().should('be.visible').and('contain', initialTerm)
      cy.get(`button:contains(${newTerm})`).should('be.visible')
    })
  })

  context('Mocking the API', () => {
    context('Footer and list of stories', () => {
      beforeEach(() => {
        cy.intercept({
          method: 'GET',
          pathname: '**/search',
          query: {
            query: initialTerm,
            page: '0'
          }
        }, { fixture: 'stories.json' }).as('getStories')
        cy.visit('/')
        cy.wait('@getStories')
      })
      it('shows the footer', () => {
        cy.get('footer').should('be.visible').and('contain', 'Icons made by Freepik from www.flaticon.com')
      })

      context('List of stories', () => { 
        const stories = require('../fixtures/stories')
        it('shows the right data for all rendered stories', () => {
          cy.get('.item').first().should('be.visible').and('contain', stories.hits[0].title).and('contain', stories.hits[0].author).and('contain', stories.hits[0].num_comments).and('contain', stories.hits[0].points)
          cy.get(`.item a:contains(${stories.hits[0].title})`).should('have.attr', 'href', stories.hits[0].url)
          cy.get('.item').last().should('be.visible').and('contain', stories.hits[1].title).and('contain', stories.hits[1].author).and('contain', stories.hits[1].num_comments).and('contain', stories.hits[1].points)
          cy.get(`.item a:contains(${stories.hits[1].title})`).should('have.attr', 'href', stories.hits[1].url)
        })

        it('shows only less stories after dimissing the first one', () => {
          cy.get('.button-small').first().should('be.visible').click()

          cy.get('.item').should('have.length', 1)
        })

        context('Order by', () => {
          it('orders by title', () => {
            cy.get('.list-header-button:contains(Title)').should('be.visible').click()            
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[0].title)
            cy.get(`.item a:contains(${stories.hits[0].title})`).should('have.attr', 'href', stories.hits[0].url)
            cy.get('.list-header-button:contains(Title)').click()
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[1].title)
            cy.get(`.item a:contains(${stories.hits[1].title})`).should('have.attr', 'href', stories.hits[1].url)
           })

          it('orders by author', () => {
            cy.get('.list-header-button:contains(Author)').should('be.visible').click()            
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[0].title)
            cy.get('.list-header-button:contains(Author)').click()
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[1].title)
           })

          it('orders by comments', () => { 
            cy.get('.list-header-button:contains(Comments)').should('be.visible').click()            
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[0].title)
            cy.get('.list-header-button:contains(Comments)').click()
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[1].title)
          })


          it('orders by points', () => { 
            cy.get('.list-header-button:contains(Points)').should('be.visible').click()            
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[0].title)
            cy.get('.list-header-button:contains(Points)').click()
            cy.get('.item').first().should('be.visible').and('contain', stories.hits[1].title)
          })
        })
      })
    })

    context('Search', () => {
      const initialTerm = 'React'
      const newTerm = 'Cypress'

      beforeEach(() => {
        cy.intercept({
          method: 'GET',
          pathname: '**/search',
          query: {
            query: initialTerm,
            page: '0'
          }
        }, { fixture: 'empty.json' }).as('getEmptyStories')

        cy.intercept({
          method: 'GET',
          pathname: '**/search',
          query: {
            query: newTerm,
            page: '0'
          }

        }, { fixture: 'stories.json' }).as('getStories')

        cy.visit('/')
        cy.wait('@getEmptyStories')
        cy.get('#search').should('be.visible').clear()
      })

      it('shows a "Loading ..." state before showing the results', () => {
        cy.intercept({method: 'GET',pathname: '**/search**'}, {delay: 1000, fixture: 'stories.json' }).as('getDelayedStories')
        cy.visit('/')
        cy.assertLoadingIsShownAndHidden()        
        cy.wait('@getDelayedStories')
        cy.get('.item').should('have.length', 2)
      })

      it('shows no stories when none are returned', () => {
        cy.get('.item').should('not.exist')
        cy.get('.item').should('have.length', 0)
      })

      it('types and hits ENTER', () => {
        cy.get('#search').should('be.visible').type(`${newTerm}{enter}`)
        cy.wait('@getStories')
        cy.getLocalStorage('search').should('be.equal', newTerm)

        cy.get('.item').should('have.length', 2)
        cy.get(`button:contains(${initialTerm})`).should('be.visible')
      })

      it('types and clicks the submit button', () => {
        cy.get('#search').type(newTerm)
        cy.contains('Submit').should('be.visible').click()
        cy.wait('@getStories')
        cy.getLocalStorage('search').should('be.equal', newTerm)
        cy.get('.item').should('have.length', 2)
        cy.get(`button:contains(${initialTerm})`).should('be.visible')
      })

      it('types and submits the form directly', () => {
        cy.get('#search').should('be.visible').type(newTerm)
        cy.get('form').submit()
        cy.wait('@getStories')
        cy.getLocalStorage('search').should('be.equal', newTerm)
        cy.get('.item').should('have.length', 2)
      })

      context('Last searches', () => {
        it('shows a max of 5 buttons for the last searched terms', () => {
          const faker = require('faker')
          cy.intercept({
            method: 'GET',
            pathname: '**/search',
            query: {
              page: '0'
            }
          }, { fixture: 'empty.json' }).as('getRandomTermStories')

          Cypress._.times(6, () => {
            const randomWord = faker.random.word()
            cy.get('#search').clear().type(`${randomWord}{enter}`)
            cy.wait('@getRandomTermStories')
            cy.getLocalStorage('search').should('be.equal', randomWord)
          })

          cy.get('.last-searches button').should('have.length', 5)
          cy.get('.last-searches').within(() => {
            cy.get('button').should('have.length', 5)
          })
          
        })
      })
    })
  })
})

context.skip('Errors', () => {
  it('shows "Something went wrong ..." in case of a server error', () => {
    cy.intercept('GET', '**/search**', { statusCode: 500 }).as('getServerError')
    cy.visit('/')
    cy.wait('@getServerError')
    cy.get('p:contains(Something went wrong ...)').should('be.visible')
  })

  it('shows "Something went wrong ..." in case of a network error', () => {
    cy.intercept('GET', '**/search**', { forceNetworkError: true }).as('getNetworkError')
    cy.visit('/')
    cy.wait('@getNetworkError')
    cy.get('p:contains(Something went wrong ...)').should('be.visible')
  })
})
