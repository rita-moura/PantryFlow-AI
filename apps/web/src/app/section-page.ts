import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface PageData {
  readonly key: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly summary: string;
  readonly cards: readonly string[];
}

@Component({
  selector: 'app-section-page',
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <div>
        <p class="eyebrow">{{ page.eyebrow }}</p>
        <h1>{{ page.title }}</h1>
        <p class="summary">{{ page.summary }}</p>
      </div>
      <button class="primary">{{ page.key === 'dashboard' ? 'Plan my day' : 'Add new' }}</button>
    </header>
    @if (page.key === 'dashboard') {
      <section class="metrics" aria-label="Daily nutrition">
        <article>
          <span>Calories</span><strong>760 / 2,000</strong>
          <div class="progress"><i style="width:38%"></i></div>
        </article>
        <article>
          <span>Protein</span><strong>32 / 110 g</strong>
          <div class="progress"><i style="width:29%"></i></div>
        </article>
        <article>
          <span>Fiber</span><strong>11 / 30 g</strong>
          <div class="progress"><i style="width:37%"></i></div>
        </article>
      </section>
    }
    <section class="section-grid">
      <article class="panel">
        <div class="panel-heading">
          <h2>{{ page.key === 'dashboard' ? 'Your next steps' : 'Overview' }}</h2>
          <span class="badge">Live</span>
        </div>
        <div class="items">
          @for (card of page.cards; track card) {
            <div class="item">
              <span class="dot"></span><span>{{ card }}</span
              ><button class="quiet">View</button>
            </div>
          }
        </div>
      </article>
      <article class="panel note">
        <h2>{{ page.key === 'dashboard' ? 'Expiring soon' : 'A calmer way to plan' }}</h2>
        <p>
          {{
            page.key === 'dashboard'
              ? 'Broccoli and yogurt should be used in the next 48 hours. Your planner will prioritize them.'
              : 'PantryFlow keeps nutrition calculations deterministic, so every recommendation stays explainable.'
          }}
        </p>
        <a routerLink="/meal-plan">Open meal plan →</a>
      </article>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 78rem;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        align-items: flex-start;
        margin-bottom: 2.5rem;
      }
      .eyebrow {
        color: #86efac;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        margin: 0 0 0.75rem;
      }
      h1 {
        font-size: clamp(2rem, 4vw, 3.6rem);
        letter-spacing: -0.05em;
        line-height: 1;
        margin: 0 0 0.8rem;
      }
      .summary {
        color: #9db5a4;
        max-width: 42rem;
        line-height: 1.6;
        margin: 0;
      }
      .primary {
        background: #86efac;
        border: 0;
        border-radius: 0.65rem;
        color: #07110d;
        font: inherit;
        font-weight: 800;
        padding: 0.75rem 1rem;
        white-space: nowrap;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .metrics article,
      .panel {
        border: 1px solid #1b3a27;
        border-radius: 1rem;
        background: #0b1b11;
        padding: 1.25rem;
      }
      .metrics span {
        display: block;
        color: #8ba895;
        font-size: 0.82rem;
      }
      .metrics strong {
        display: block;
        font-size: 1.35rem;
        margin: 1rem 0;
      }
      .progress {
        height: 0.35rem;
        border-radius: 1rem;
        background: #193322;
        overflow: hidden;
      }
      .progress i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: #86efac;
      }
      .section-grid {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 1rem;
      }
      .panel-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .panel h2 {
        font-size: 1rem;
        margin: 0;
      }
      .badge {
        color: #86efac;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .items {
        margin-top: 1rem;
      }
      .item {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        padding: 0.85rem 0;
        border-top: 1px solid #183324;
        color: #d9e9dd;
      }
      .dot {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: #86efac;
      }
      .quiet {
        margin-left: auto;
        background: transparent;
        border: 0;
        color: #86efac;
      }
      .note p {
        color: #9db5a4;
        line-height: 1.7;
      }
      .note a {
        color: #86efac;
        text-decoration: none;
        font-weight: 700;
      }
      @media (max-width: 700px) {
        .page-header {
          display: block;
        }
        .primary {
          margin-top: 1.2rem;
        }
        .metrics,
        .section-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPage {
  readonly page = inject(ActivatedRoute).snapshot.data as PageData;
}
