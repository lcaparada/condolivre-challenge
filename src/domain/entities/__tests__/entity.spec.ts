import { Entity } from '../entity';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class ConcreteEntity extends Entity<{ name: string }> {
  constructor(props: { name: string }, id?: string) {
    super(props, id);
  }
}

describe('Entity', () => {
  describe('when no id is provided', () => {
    it('generates an id in UUID format', () => {
      const entity = new ConcreteEntity({ name: 'Test' });

      expect(entity.id).toMatch(UUID_REGEX);
    });

    it('each entity receives a unique id', () => {
      const entity1 = new ConcreteEntity({ name: 'A' });
      const entity2 = new ConcreteEntity({ name: 'B' });

      expect(entity1.id).not.toBe(entity2.id);
    });
  });

  describe('when an id is provided', () => {
    it('uses the provided id', () => {
      const id = 'provided-id';
      const entity = new ConcreteEntity({ name: 'Test' }, id);

      expect(entity.id).toBe(id);
    });
  });

  describe('props', () => {
    it('stores and exposes props correctly', () => {
      const props = { name: 'My Entity' };
      const entity = new ConcreteEntity(props);

      expect(entity.props).toEqual(props);
      expect(entity.props.name).toBe('My Entity');
    });
  });

  describe('toJSON', () => {
    it('returns object with id and props', () => {
      const props = { name: 'Test' };
      const entity = new ConcreteEntity(props, 'id-123');

      const json = entity.toJSON();

      expect(json).toEqual({
        id: 'id-123',
        name: 'Test',
      });
    });

    it('includes generated id when not provided', () => {
      const entity = new ConcreteEntity({ name: 'Test' });
      const json = entity.toJSON();

      expect(json).toHaveProperty('id');
      expect(json.id).toMatch(UUID_REGEX);
      expect(json).toHaveProperty('name', 'Test');
    });
  });
});
