import PropTypes from 'prop-types';
import { DefaultButton } from '@fluentui/react/lib/Button';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';

const Channel = (props) => {
    const {
        title,
        description,
        id,
        image,
        // updatedAt,
    } = props;

    const classNames = mergeStyleSets({
        itemCell: {
            height: 160,
            width: '100%',
            margin: 5,
        },
    });

    return (
        <DefaultButton className={classNames.itemCell}>
            <img src={image} alt={title} />
            <p>{title}</p>
            <p>{description}</p>
            <p>{id}</p>
        </DefaultButton>
    );
};

Channel.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
};

export { Channel }