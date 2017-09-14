import { define } from '@xinix/xin';
import { View } from '@xinix/xin/views/view';
import html from './app-add-contact.html';
import { Logger } from 'twlv-logger';
import './app-add-contact.css';

const logger = new Logger('twlv-chat:views:app-add-contact');
const { chat, toast, loading } = window;

class AppAddContact extends View {
  get template () {
    return html;
  }

  get props () {
    return Object.assign({}, super.props, {
      address: {
        type: String,
        value: '',
        observer: 'search(address)',
      },
      person: {
        type: Object,
        value: {},
      },
    });
  }

  ready () {
    super.ready();
  }

  search (address) {
    if (!address || address.length < 20) {
      return;
    }

    this.debounce('_search', async () => {
      try {
        window.loading.show();
        let person = await chat.query(address);
        this.set('person', person);
        window.loading.hide();
      } catch (err) {
        this.set('person', { address: this.address });
        window.loading.hide();
        logger.error('Error on search', err);
        toast.show(`Peer not found or disconnected`);
      }
    }, 300);
  }

  async doAdd (evt) {
    evt.preventDefault();

    try {
      loading.show();
      await chat.addContact(this.person);
      loading.hide();
      toast.show(`Contact added`);
    } catch (err) {
      toast.show(`Failed adding contact, ${err.message}`);
      loading.hide();
    }
  }
}

define('app-add-contact', AppAddContact);
